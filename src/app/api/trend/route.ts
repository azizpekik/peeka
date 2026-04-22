import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiResponse } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const telegram_id = searchParams.get('telegram_id')
    const range = searchParams.get('range') || 'daily'

    if (!telegram_id) {
      return NextResponse.json({ error: 'telegram_id required' }, { status: 400 })
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const today = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]
    let startDate = new Date()

    if (range === 'daily') {
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 7)
    } else if (range === 'weekly') {
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 28)
    } else if (range === 'monthly') {
      startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - 3)
    }

    const { data: transaksi, error } = await supabaseAdmin
      .from('transaksi')
      .select('*, transaksi_items(*)')
      .eq('user_id', user.id)
      .gte('tanggal', startDate.toISOString().split('T')[0])
      .lte('tanggal', today)
      .order('tanggal', { ascending: true })

    if (error) throw error

    const { data: pengeluaran } = await supabaseAdmin
      .from('pengeluaran')
      .select('*')
      .eq('user_id', user.id)
      .gte('tanggal', startDate.toISOString().split('T')[0])
      .lte('tanggal', today)

    const groupedData: Record<string, { tanggal: string; penjualan: number; pengeluaran: number }> = {}

    transaksi?.forEach(t => {
      const dateKey = t.tanggal
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { tanggal: dateKey, penjualan: 0, pengeluaran: 0 }
      }
      if (t.status_bayar === 'pengeluaran') {
        groupedData[dateKey].pengeluaran += t.total_nominal || 0
      } else {
        groupedData[dateKey].penjualan += t.total_nominal || 0
      }
    })

    pengeluaran?.forEach(p => {
      const dateKey = p.tanggal
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { tanggal: dateKey, penjualan: 0, pengeluaran: 0 }
      }
      groupedData[dateKey].pengeluaran += p.nominal || 0
    })

    const trendData = Object.values(groupedData)
      .map(g => ({
        tanggal: g.tanggal,
        penjualan: g.penjualan,
        pengeluaran: g.pengeluaran,
        laba: g.penjualan - g.pengeluaran
      }))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))

    const labels: Record<string, string> = {
      daily: '7 Hari Terakhir',
      weekly: '4 Minggu Terakhir',
      monthly: '3 Bulan Terakhir'
    }

    return NextResponse.json({
      success: true,
      data: {
        range: range,
        label: labels[range] || '7 Hari Terakhir',
        data: trendData
      }
    })

  } catch (error: any) {
    console.error('API Trend Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}