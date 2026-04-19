import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiResponse, RekapHarian } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const telegram_id = searchParams.get('telegram_id')
    const tanggal = searchParams.get('tanggal') || 
      new Date().toISOString().split('T')[0]

    if (!telegram_id) {
      return NextResponse.json(
        { error: 'telegram_id required' },
        { status: 400 }
      )
    }

    // Cari user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, nama_toko, nama_pemilik')
      .eq('telegram_id', telegram_id)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Panggil DB function rekap_harian
    const { data: rekap, error: rekapError } = await supabaseAdmin
      .rpc('rekap_harian', {
        p_user_id: user.id,
        p_tanggal: tanggal
      })

    if (rekapError) {
      throw new Error(rekapError.message)
    }

    const r = rekap[0] as RekapHarian

    // Ambil detail transaksi hari ini
    const { data: transaksi } = await supabaseAdmin
      .from('transaksi')
      .select(`*, transaksi_items(*)`)
      .eq('user_id', user.id)
      .eq('tanggal', tanggal)
      .order('created_at', { ascending: false })

    // Ambil detail pengeluaran hari ini
    const { data: pengeluaran } = await supabaseAdmin
      .from('pengeluaran')
      .select('*')
      .eq('user_id', user.id)
      .eq('tanggal', tanggal)
      .order('created_at', { ascending: false })

    // Ambil piutang aktif
    const { data: piutang_aktif } = await supabaseAdmin
      .from('piutang')
      .select('nama_pelanggan, sisa_hutang, created_at')
      .eq('user_id', user.id)
      .eq('status', 'aktif')
      .order('created_at', { ascending: false })

    // Format laporan untuk Telegram
    const formatRupiah = (n: number) =>
      'Rp ' + n.toLocaleString('id-ID')

    const tanggalFormatted = new Date(tanggal).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const telegramText = `
🪲 *Laporan Peeka*
📅 ${tanggalFormatted}
🏪 ${user.nama_toko}

━━━━━━━━━━━━━━━
💰 *PEMASUKAN*
━━━━━━━━━━━━━━━
Total penjualan : ${formatRupiah(r?.total_penjualan || 0)}
├ Cash          : ${formatRupiah(r?.total_cash || 0)}
└ Piutang baru  : ${formatRupiah(r?.total_piutang_baru || 0)}
Jumlah transaksi: ${r?.jumlah_transaksi || 0}x

━━━━━━━━━━━━━━━
💸 *PENGELUARAN*
━━━━━━━━━━━━━━━
Total keluar    : ${formatRupiah(r?.total_pengeluaran || 0)}

━━━━━━━━━━━━━━━
📊 *LABA KOTOR*
━━━━━━━━━━━━━━━
${formatRupiah(r?.laba_kotor || 0)}

${(piutang_aktif?.length || 0) > 0 ? `
━━━━━━━━━━━━━━━
⚠️ *PIUTANG AKTIF*
━━━━━━━━━━━━━━━
${piutang_aktif?.map(p =>
  `• ${p.nama_pelanggan}: ${formatRupiah(p.sisa_hutang)}`
).join('\n')}
Total piutang: ${formatRupiah(
  piutang_aktif?.reduce((s, p) => s + p.sisa_hutang, 0) || 0
)}` : '✅ Tidak ada piutang aktif'}

━━━━━━━━━━━━━━━
_Dikirim otomatis oleh Peeka 🪲_
`.trim()

    return NextResponse.json({
      data: {
        toko: {
          nama_toko: user.nama_toko,
          nama_pemilik: user.nama_pemilik
        },
        tanggal,
        rekap: r,
        transaksi,
        pengeluaran,
        piutang_aktif,
        telegram_text: telegramText
      },
      message: 'Laporan berhasil dibuat'
    } as ApiResponse<any>)

  } catch (error) {
    console.error('Error laporan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}