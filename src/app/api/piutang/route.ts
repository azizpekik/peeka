import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateWebhookSecret } from '@/lib/utils'
import { ApiResponse, Piutang } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const telegram_id = searchParams.get('telegram_id')
  const status = searchParams.get('status') || 'aktif'

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

  const { data, error } = await supabaseAdmin
    .from('piutang')
    .select(`
      *,
      transaksi (nomor_nota, tanggal),
      pembayaran_piutang (id, nominal, catatan, created_at)
    `)
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// Bayar piutang — cicil atau lunas
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { piutang_id, nominal, catatan } = body

    if (!piutang_id || !nominal || nominal <= 0) {
      return NextResponse.json(
        { error: 'piutang_id dan nominal wajib diisi' },
        { status: 400 }
      )
    }

    // Cek piutang ada dan masih aktif
    const { data: piutang, error: piutangError } = await supabaseAdmin
      .from('piutang')
      .select('*')
      .eq('id', piutang_id)
      .single()

    if (piutangError || !piutang) {
      return NextResponse.json({ error: 'Piutang tidak ditemukan' }, { status: 404 })
    }

    if (piutang.status === 'lunas') {
      return NextResponse.json({ error: 'Piutang sudah lunas' }, { status: 400 })
    }

    // Validasi nominal tidak melebihi sisa
    if (nominal > piutang.sisa_hutang) {
      return NextResponse.json({
        error: `Nominal melebihi sisa hutang (Rp ${piutang.sisa_hutang.toLocaleString('id-ID')})`
      }, { status: 400 })
    }

    // Insert pembayaran — trigger DB akan auto update piutang
    const { data: pembayaran, error: bayarError } = await supabaseAdmin
      .from('pembayaran_piutang')
      .insert({
        piutang_id,
        nominal: parseInt(nominal),
        catatan: catatan || null
      })
      .select()
      .single()

    if (bayarError || !pembayaran) {
      throw new Error(bayarError?.message || 'Gagal simpan pembayaran')
    }

    // Ambil data piutang terbaru setelah trigger jalan
    const { data: piutangUpdated } = await supabaseAdmin
      .from('piutang')
      .select('*')
      .eq('id', piutang_id)
      .single()

    return NextResponse.json({
      data: {
        pembayaran,
        piutang: piutangUpdated
      },
      message: piutangUpdated?.status === 'lunas'
        ? 'Piutang lunas! 🎉'
        : `Pembayaran diterima. Sisa: Rp ${piutangUpdated?.sisa_hutang.toLocaleString('id-ID')}`
    })

  } catch (error) {
    console.error('Error bayar piutang:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}