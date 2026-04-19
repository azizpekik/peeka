import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateWebhookSecret } from '@/lib/utils'
import { ApiResponse, Transaksi } from '@/types'

export async function POST(req: NextRequest) {
  try {
    // Validasi secret dari n8n
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      telegram_id,
      items,         // array of {nama_item, harga, qty}
      status_bayar,
      nama_pelanggan,
      catatan
    } = body

    // 1. Cari user by telegram_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' } as ApiResponse<null>,
        { status: 404 }
      )
    }

    // 2. Generate nomor nota via DB function
    const { data: nomorData } = await supabaseAdmin
      .rpc('generate_nomor_nota', { p_user_id: user.id })

    const nomor_nota = nomorData || `PEEKA-${Date.now()}`

    // 3. Hitung total
    const total_nominal = items.reduce(
      (sum: number, item: { harga: number; qty: number }) =>
        sum + item.harga * item.qty,
      0
    )

    // 4. Insert transaksi header
    const { data: transaksi, error: transaksiError } = await supabaseAdmin
      .from('transaksi')
      .insert({
        user_id: user.id,
        nomor_nota,
        total_nominal,
        status_bayar,
        nama_pelanggan: nama_pelanggan || null,
        catatan: catatan || null
      })
      .select()
      .single()

    if (transaksiError || !transaksi) {
      throw new Error(transaksiError?.message || 'Gagal simpan transaksi')
    }

    // 5. Insert items
    const itemsToInsert = items.map((item: {
      nama_item: string
      harga: number
      qty: number
    }) => ({
      transaksi_id: transaksi.id,
      nama_item: item.nama_item,
      harga: item.harga,
      qty: item.qty
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('transaksi_items')
      .insert(itemsToInsert)

    if (itemsError) {
      throw new Error(itemsError.message)
    }

    // 6. Kalau piutang → insert ke tabel piutang
    if (status_bayar === 'piutang' && nama_pelanggan) {
      await supabaseAdmin
        .from('piutang')
        .insert({
          transaksi_id: transaksi.id,
          user_id: user.id,
          nama_pelanggan,
          total_hutang: total_nominal,
          total_terbayar: 0
        })
    }

    // 7. Return data untuk n8n (untuk generate nota)
    return NextResponse.json({
      data: {
        ...transaksi,
        items
      },
      message: 'Transaksi berhasil disimpan'
    } as ApiResponse<Transaksi>)

  } catch (error) {
    console.error('Error transaksi:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    )
  }
}

// GET — ambil transaksi by user (untuk dashboard)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const telegram_id = searchParams.get('telegram_id')
  const tanggal = searchParams.get('tanggal')

  if (!telegram_id) {
    return NextResponse.json({ error: 'telegram_id required' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('telegram_id', telegram_id)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  let query = supabaseAdmin
    .from('transaksi')
    .select(`
      *,
      transaksi_items (*),
      piutang (status, sisa_hutang)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (tanggal) {
    query = query.eq('tanggal', tanggal)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// PUT — edit transaksi
export async function PUT(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      transaksi_id,
      items,          // array of {nama_item, harga, qty}
      status_bayar,
      nama_pelanggan,
      catatan
    } = body

    if (!transaksi_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'transaksi_id dan items wajib diisi' },
        { status: 400 }
      )
    }

    // 1. Ambil transaksi lama
    const { data: transaksiLama, error: fetchError } = await supabaseAdmin
      .from('transaksi')
      .select('*, users(id)')
      .eq('id', transaksi_id)
      .single()

    if (fetchError || !transaksiLama) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // 2. Hitung total baru
    const total_nominal = items.reduce(
      (sum: number, item: { harga: number; qty: number }) =>
        sum + item.harga * item.qty,
      0
    )

    // 3. Update header transaksi
    const { data: transaksiBaru, error: updateError } = await supabaseAdmin
      .from('transaksi')
      .update({
        total_nominal,
        status_bayar,
        nama_pelanggan: nama_pelanggan || null,
        catatan: catatan || null,
      })
      .eq('id', transaksi_id)
      .select()
      .single()

    if (updateError || !transaksiBaru) {
      throw new Error(updateError?.message || 'Gagal update transaksi')
    }

    // 4. Hapus items lama → insert items baru
    await supabaseAdmin
      .from('transaksi_items')
      .delete()
      .eq('transaksi_id', transaksi_id)

    const itemsToInsert = items.map((item: {
      nama_item: string
      harga: number
      qty: number
    }) => ({
      transaksi_id,
      nama_item: item.nama_item,
      harga: item.harga,
      qty: item.qty
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('transaksi_items')
      .insert(itemsToInsert)

    if (itemsError) {
      throw new Error(itemsError.message)
    }

    // 5. Update piutang kalau ada
    const { data: piutang } = await supabaseAdmin
      .from('piutang')
      .select('id, status')
      .eq('transaksi_id', transaksi_id)
      .single()

    if (piutang) {
      if (status_bayar === 'cash') {
        // Kalau diubah jadi cash → hapus piutang
        await supabaseAdmin
          .from('piutang')
          .delete()
          .eq('transaksi_id', transaksi_id)
      } else {
        // Update total hutang piutang
        await supabaseAdmin
          .from('piutang')
          .update({
            total_hutang: total_nominal,
            nama_pelanggan: nama_pelanggan || piutang.id
          })
          .eq('transaksi_id', transaksi_id)
      }
    } else if (status_bayar === 'piutang' && nama_pelanggan) {
      // Kalau diubah dari cash → piutang, buat piutang baru
      await supabaseAdmin
        .from('piutang')
        .insert({
          transaksi_id,
          user_id: transaksiLama.user_id,
          nama_pelanggan,
          total_hutang: total_nominal,
          total_terbayar: 0
        })
    }

    return NextResponse.json({
      data: { ...transaksiBaru, items },
      message: 'Transaksi berhasil diupdate'
    })

  } catch (error) {
    console.error('Error update transaksi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE — hapus transaksi
export async function DELETE(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const transaksi_id = searchParams.get('transaksi_id')

    if (!transaksi_id) {
      return NextResponse.json(
        { error: 'transaksi_id wajib diisi' },
        { status: 400 }
      )
    }

    // Hapus transaksi — cascade otomatis hapus:
    // transaksi_items (ON DELETE CASCADE)
    // piutang (ON DELETE CASCADE)
    const { error } = await supabaseAdmin
      .from('transaksi')
      .delete()
      .eq('id', transaksi_id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      message: 'Transaksi berhasil dihapus'
    })

  } catch (error) {
    console.error('Error delete transaksi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}