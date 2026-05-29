import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const telegram_id = searchParams.get('telegram_id')
    const tanggal = searchParams.get('tanggal')
    const range = searchParams.get('range') || '1' // 1, 7, 30, 90, 365, all
    
    if (!telegram_id) {
      return NextResponse.json({ error: 'telegram_id required' }, { status: 400 })
    }

    // CARI user_id berdasarkan telegram_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Calculate date range
    const jakartaNow = new Date()
    jakartaNow.setHours(jakartaNow.getHours() + 7) // Convert to Jakarta time
    
    let startDateStr: string | null = null
    let endDate: string
    let days = 0
    
    if (range === 'all') {
      // For 'all', we don't filter by date
      endDate = tanggal || jakartaNow.toISOString().split('T')[0]
    } else {
      days = parseInt(range)
      endDate = tanggal || jakartaNow.toISOString().split('T')[0]
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - days + 1)
      startDateStr = startDate.toISOString().split('T')[0]
    }

    // QUERY DATABASE dengan range tanggal
    let transaksiQuery = supabaseAdmin
      .from('transaksi')
      .select(`*, transaksi_items(*)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (startDateStr) {
      transaksiQuery = transaksiQuery.gte('tanggal', startDateStr).lte('tanggal', endDate)
    }

    const { data: transaksi, error } = await transaksiQuery

    if (error) throw error;

    // Ambil data pengeluaran dengan range
    let pengeluaranQuery = supabaseAdmin
      .from('pengeluaran')
      .select('nominal, kategori, tanggal, created_at')
      .eq('user_id', user.id)
    
    if (startDateStr) {
      pengeluaranQuery = pengeluaranQuery.gte('tanggal', startDateStr).lte('tanggal', endDate)
    }

    const { data: pengeluaranData, error: pengeluaranError } = await pengeluaranQuery

    if (pengeluaranError) throw pengeluaranError;

    // Calculate totals
    const total_pengeluaran_db = pengeluaranData
      ?.reduce((acc, curr) => acc + (curr.nominal || 0), 0) || 0;

    const total_pemasukan = transaksi
      ?.filter(t => t.status_bayar === 'cash' || t.status_bayar === 'lunas' || t.status_bayar === 'piutang')
      .reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0;

    const total_pengeluaran = (transaksi
      ?.filter(t => t.status_bayar === 'pengeluaran')
      .reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0) + total_pengeluaran_db;

    const total_cash = transaksi
      ?.filter(t => t.status_bayar === 'cash' || t.status_bayar === 'lunas')
      .reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0;

    const total_piutang = transaksi
      ?.filter(t => t.status_bayar === 'piutang')
      .reduce((acc, curr) => acc + (curr.total_hutang || 0), 0) || 0;

    // Calculate previous period for trend comparison (skip for 'all')
    let trends = {
      pemasukan: 0,
      pengeluaran: 0,
      laba: 0
    }
    
    if (range !== 'all' && days > 0) {
      const prevEndDate = new Date(startDateStr || endDate)
      prevEndDate.setDate(prevEndDate.getDate() - 1)
      const prevStartDate = new Date(prevEndDate)
      prevStartDate.setDate(prevStartDate.getDate() - days + 1)
      
      const { data: prevTransaksi } = await supabaseAdmin
        .from('transaksi')
        .select('total_nominal, status_bayar')
        .eq('user_id', user.id)
        .gte('tanggal', prevStartDate.toISOString().split('T')[0])
        .lte('tanggal', prevEndDate.toISOString().split('T')[0])

      const { data: prevPengeluaran } = await supabaseAdmin
        .from('pengeluaran')
        .select('nominal')
        .eq('user_id', user.id)
        .gte('tanggal', prevStartDate.toISOString().split('T')[0])
        .lte('tanggal', prevEndDate.toISOString().split('T')[0])

      const prevTotalPemasukan = prevTransaksi
        ?.filter(t => t.status_bayar === 'cash' || t.status_bayar === 'lunas' || t.status_bayar === 'piutang')
        .reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0;

      const prevTotalPengeluaran = (prevTransaksi
        ?.filter(t => t.status_bayar === 'pengeluaran')
        .reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) || 0) + 
        (prevPengeluaran?.reduce((acc, curr) => acc + (curr.nominal || 0), 0) || 0);

      // Calculate trends
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
      }

      trends = {
        pemasukan: calculateTrend(total_pemasukan, prevTotalPemasukan),
        pengeluaran: calculateTrend(total_pengeluaran, prevTotalPengeluaran),
        laba: calculateTrend(total_pemasukan - total_pengeluaran, prevTotalPemasukan - prevTotalPengeluaran)
      }
    }

    // Group data by date for chart
    const dailyData: Record<string, { pemasukan: number; pengeluaran: number; transaksi: number }> = {}
    
    // Initialize all dates in range (skip for 'all' - use actual dates from data)
    if (range !== 'all' && days > 0 && startDateStr) {
      for (let i = 0; i < days; i++) {
        const d = new Date(startDateStr)
        d.setDate(d.getDate() + i)
        dailyData[d.toISOString().split('T')[0]] = { pemasukan: 0, pengeluaran: 0, transaksi: 0 }
      }
    } else {
      // For 'all', initialize with dates from actual data
      const uniqueDates = new Set<string>()
      transaksi?.forEach(t => uniqueDates.add(t.tanggal))
      pengeluaranData?.forEach(p => uniqueDates.add(p.tanggal))
      
      Array.from(uniqueDates).sort().forEach(date => {
        dailyData[date] = { pemasukan: 0, pengeluaran: 0, transaksi: 0 }
      })
    }

    // Fill transaction data
    transaksi?.forEach(t => {
      const date = t.tanggal
      if (dailyData[date]) {
        if (t.status_bayar === 'cash' || t.status_bayar === 'lunas' || t.status_bayar === 'piutang') {
          dailyData[date].pemasukan += t.total_nominal || 0
          dailyData[date].transaksi += 1
        } else if (t.status_bayar === 'pengeluaran') {
          dailyData[date].pengeluaran += t.total_nominal || 0
        }
      }
    })

    // Fill pengeluaran data
    pengeluaranData?.forEach(p => {
      const date = p.tanggal
      if (dailyData[date]) {
        dailyData[date].pengeluaran += p.nominal || 0
      }
    })

    const chart_data = Object.entries(dailyData).map(([date, data]) => ({
      tanggal: date,
      penjualan: data.pemasukan,
      pengeluaran: data.pengeluaran,
      laba: data.pemasukan - data.pengeluaran,
      transaksi: data.transaksi
    }))

    // Kategori pengeluaran untuk donut chart
    const kategoriPengeluaran: Record<string, number> = {}
    pengeluaranData?.forEach(p => {
      const kat = p.kategori || 'Lainnya'
      kategoriPengeluaran[kat] = (kategoriPengeluaran[kat] || 0) + (p.nominal || 0)
    })
    
    // Also add pengeluaran from transaksi
    transaksi?.filter(t => t.status_bayar === 'pengeluaran').forEach(t => {
      kategoriPengeluaran['Transaksi Pengeluaran'] = (kategoriPengeluaran['Transaksi Pengeluaran'] || 0) + (t.total_nominal || 0)
    })

    const kategoriData = Object.entries(kategoriPengeluaran)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value)

    return NextResponse.json({
      success: true,
      data: {
        total_pemasukan,
        total_pengeluaran,
        total_cash,
        total_piutang,
        chart_data,
        transaksi_list: transaksi || [], // Kirim semua data transaksi
        kategori_pengeluaran: kategoriData,
        trends,
        meta: {
          range: range === 'all' ? 'all' : days,
          startDate: startDateStr,
          endDate,
          total_transaksi: transaksi?.length || 0
        }
      }
    });

  } catch (error: any) {
    console.error('API Laporan Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}