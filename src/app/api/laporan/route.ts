import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiResponse, RekapHarian } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const telegram_id = searchParams.get('telegram_id')
    
    // Perbaikan Timezone: Ambil tanggal dari param atau default ke WIB hari ini
    const tanggal = searchParams.get('tanggal') || 
      new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]

    if (!telegram_id) {
      return NextResponse.json(
        { error: 'telegram_id required' },
        { status: 400 }
      )
    }

    // QUERY DATABASE (Tanpa redeclare const lagi)
    const { data: transaksi, error } = await supabaseAdmin
      .from('transaksi')
      .select(`*, transaksi_items(*)`)
      .eq('telegram_id', telegram_id)
      .eq('tanggal', tanggal) // Pastikan kolom 'tanggal' di DB formatnya YYYY-MM-DD
      .order('created_at', { ascending: false });

    if (error) throw error;

    // LOGIKA PERHITUNGAN
    const total_pemasukan = transaksi
      ?.filter(t => t.status_bayar === 'lunas' || t.status_bayar === 'piutang')
      .reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0;

    const total_pengeluaran = transaksi
      ?.filter(t => t.status_bayar === 'pengeluaran')
      .reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0;

    // Susun data Chart sederhana (jam vs total)
    const chart_data = transaksi
      ?.filter(t => t.status_bayar !== 'pengeluaran')
      .map(t => ({
        jam: new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        total: t.total_nominal
      })).reverse();

    return NextResponse.json({
      success: true,
      data: {
        total_pemasukan,
        total_pengeluaran,
        total_cash: transaksi?.filter(t => t.status_bayar === 'lunas').reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0,
        total_piutang: transaksi?.filter(t => t.status_bayar === 'piutang').reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0,
        chart_data,
        transaksi_list: transaksi
      }
    });

  } catch (error: any) {
    console.error('API Laporan Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}