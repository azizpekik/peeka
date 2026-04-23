import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateWebhookSecret } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const telegram_id = searchParams.get('telegram_id')

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

  // Ambil transaksi dengan status_bayar = 'piutang'
  const { data: unpaidRows, error: unpaidError } = await supabaseAdmin
    .from('transaksi')
    .select(`
      id,
      nomor_nota,
      tanggal,
      total_nominal,
      nama_pelanggan,
      status_bayar,
      user_id,
      created_at
    `)
    .eq('user_id', user.id)
    .eq('status_bayar', 'piutang')
    .order('created_at', { ascending: false })

  if (unpaidError) {
    return NextResponse.json({ error: unpaidError.message }, { status: 500 })
  }

  // Ambil pembayaran untuk setiap transaksi
  const transaksiIds = (unpaidRows || []).map((t: any) => t.id)
  let pembayaranMap = new Map()

  if (transaksiIds.length > 0) {
    const { data: pembayarans } = await supabaseAdmin
      .from('transaksi_piutang')
      .select('id, nominal_bayar, tanggal_bayar, created_at, transaksi_id')
      .in('transaksi_id', transaksiIds)

    ;(pembayarans || []).forEach((p: any) => {
      if (!pembayaranMap.has(p.transaksi_id)) {
        pembayaranMap.set(p.transaksi_id, [])
      }
      pembayaranMap.get(p.transaksi_id).push(p)
    })
  }

  // Hitung sisa hutang
  const piutangData = (unpaidRows || []).map((t: any) => {
    const pembayaran = pembayaranMap.get(t.id) || []
    const totalBayar = pembayaran.reduce((s: number, p: any) => s + (p.nominal_bayar || 0), 0)
    const sisaHutang = (t.total_nominal || 0) - totalBayar
    return {
      id: t.id,
      transaksi_id: t.id,
      nomor_nota: t.nomor_nota,
      tanggal: t.tanggal,
      nama_pelanggan: t.nama_pelanggan,
      total_hutang: t.total_nominal,
      total_bayar: totalBayar,
      sisa_hutang: sisaHutang,
      status: sisaHutang <= 0 ? 'lunas' : 'aktif',
      pembayaran: pembayaran,
      created_at: t.created_at
    }
  })

  // Filter hanya yang masih aktif (sisa > 0)
  const aktifData = piutangData.filter((p: any) => p.sisa_hutang > 0)

  return NextResponse.json({ success: true, data: aktifData })
}

// Bayar piutang dari transaksi
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { transaksi_id, nominal_bayar, tanggal_bayar } = body

    if (!transaksi_id || !nominal_bayar || nominal_bayar <= 0) {
      return NextResponse.json(
        { error: 'transaksi_id dan nominal_bayar wajib diisi' },
        { status: 400 }
      )
    }

    // Cek transaksi ada dan masih piutang
    const { data: transaksi, error: trxError } = await supabaseAdmin
      .from('transaksi')
      .select('*')
      .eq('id', transaksi_id)
      .eq('status_bayar', 'piutang')
      .single()

    if (trxError || !transaksi) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan atau bukan piutang' }, { status: 404 })
    }

    // Hitung total sudah dibayar
    const { data: payments } = await supabaseAdmin
      .from('transaksi_piutang')
      .select('nominal_bayar')
      .eq('transaksi_id', transaksi_id)

    const totalBayar = (payments || []).reduce((s: number, p: any) => s + (p.nominal_bayar || 0), 0)
    const sisaHutang = (transaksi.total_nominal || 0) - totalBayar

    if (nominal_bayar > sisaHutang) {
      return NextResponse.json({
        error: `Nominal melebihi sisa hutang (Rp ${sisaHutang.toLocaleString('id-ID')})`
      }, { status: 400 })
    }

    // Insert pembayaran
    const { data: pembayaran, error: bayarError } = await supabaseAdmin
      .from('transaksi_piutang')
      .insert({
        transaksi_id,
        nominal_bayar: parseInt(nominal_bayar),
        tanggal_bayar: tanggal_bayar || new Date().toISOString()
      })
      .select()
      .single()

    if (bayarError || !pembayaran) {
      throw new Error(bayarError?.message || 'Gagal simpan pembayaran')
    }

    // Update status transaksi jika lunas
    const newTotalBayar = totalBayar + parseInt(nominal_bayar)
    const isLunas = newTotalBayar >= (transaksi.total_nominal || 0)

    if (isLunas) {
      await supabaseAdmin
        .from('transaksi')
        .update({ status_bayar: 'cash' })
        .eq('id', transaksi_id)
    }

    return NextResponse.json({
      success: true,
      data: {
        pembayaran,
        transaksi: {
          ...transaksi,
          status_bayar: isLunas ? 'cash' : 'piutang'
        },
        sisa_hutang: (transaksi.total_nominal || 0) - newTotalBayar
      },
      message: isLunas ? 'Piutang lunas!' : `Pembayaran diterima. Sisa: Rp ${((transaksi.total_nominal || 0) - newTotalBayar).toLocaleString('id-ID')}`
    })

  } catch (error) {
    console.error('Error bayar piutang:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Hapus riwayat pembayaran
export async function DELETE(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const pembayaran_id = body.pembayaran_id

    if (!pembayaran_id) {
      return NextResponse.json({ error: 'pembayaran_id required' }, { status: 400 })
    }

    console.log('Delete pembayaran_id:', pembayaran_id)
    
    const { error: deleteError } = await supabaseAdmin
      .from('transaksi_piutang')
      .delete()
      .eq('id', pembayaran_id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      throw new Error(deleteError.message)
    }

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil dihapus' })

  } catch (error) {
    console.error('Error delete pembayaran:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}