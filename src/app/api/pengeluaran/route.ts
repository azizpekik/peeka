import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateWebhookSecret } from '@/lib/utils'
import { ApiResponse, Pengeluaran } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' } as ApiResponse<null>, { status: 401 })
    }

    const body = await req.json()
    const { telegram_id, kategori, nominal, catatan } = body

    if (!telegram_id || !nominal || nominal <= 0) {
      return NextResponse.json({ error: 'telegram_id dan nominal wajib diisi' } as ApiResponse<null>, { status: 400 })
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User tidak ditemukan' } as ApiResponse<null>, { status: 404 })
    }

    const { data: pengeluaran, error } = await supabaseAdmin
      .from('pengeluaran')
      .insert({
        user_id: user.id,
        kategori: kategori || 'Lainnya',
        nominal: parseInt(nominal),
        catatan: catatan || null
      })
      .select()
      .single()

    if (error || !pengeluaran) {
      throw new Error(error?.message || 'Gagal simpan pengeluaran')
    }

    return NextResponse.json({
      data: pengeluaran,
      message: 'Pengeluaran berhasil disimpan'
    } as ApiResponse<Pengeluaran>)

  } catch (error) {
    console.error('Error pengeluaran:', error)
    return NextResponse.json({ error: 'Internal server error' } as ApiResponse<null>, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const telegram_id = searchParams.get('telegram_id')
  const range = searchParams.get('range') || '1'
  const kategori = searchParams.get('kategori') || 'semua'
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

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

  // Calculate date range based on selected range
  const jakartaNow = new Date()
  jakartaNow.setHours(jakartaNow.getHours() + 7) // Convert to Jakarta time
  
  let startDateStr: string | null = null
  let endDateStr: string | null = null

  if (range !== 'all') {
    const days = parseInt(range)
    const endDate = new Date(jakartaNow)
    const startDate = new Date(jakartaNow)
    startDate.setDate(startDate.getDate() - days + 1)
    
    startDateStr = startDate.toISOString().split('T')[0]
    endDateStr = endDate.toISOString().split('T')[0]
  }

  // Build query for current period
  let query = supabaseAdmin
    .from('pengeluaran')
    .select('*')
    .eq('user_id', user.id)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })

  // Apply date range filter
  if (startDateStr && endDateStr) {
    query = query.gte('tanggal', startDateStr).lte('tanggal', endDateStr)
  }

  const { data: allData, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Apply client-side filtering for kategori and search
  let filteredData = allData || []

  // Filter by kategori
  if (kategori !== 'semua') {
    filteredData = filteredData.filter((p: any) => p.kategori === kategori)
  }

  // Filter by search (catatan, kategori)
  if (search && search.trim() !== '') {
    const searchLower = search.toLowerCase()
    filteredData = filteredData.filter((p: any) => {
      const catatanMatch = p.catatan?.toLowerCase().includes(searchLower)
      const kategoriMatch = p.kategori?.toLowerCase().includes(searchLower)
      return catatanMatch || kategoriMatch
    })
  }

  // Calculate total count after filtering
  const totalCount = filteredData.length

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit
  const paginatedData = filteredData.slice(from, to)

  // Calculate summary stats from ALL filtered data
  const stats = {
    total_pengeluaran: filteredData?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0,
    count_pengeluaran: filteredData?.length || 0
  }

  // Calculate kategori breakdown (from all data in date range, ignoring search filter)
  let kategoriBreakdown: any[] = []
  if (allData) {
    const breakdown = allData.reduce((acc: any, p: any) => {
      const kat = p.kategori || 'Lainnya'
      if (!acc[kat]) {
        acc[kat] = { total: 0, count: 0 }
      }
      acc[kat].total += (p.nominal || 0)
      acc[kat].count += 1
      return acc
    }, {})
    
    kategoriBreakdown = Object.entries(breakdown).map(([kategori, data]: [string, any]) => ({
      kategori,
      total: data.total,
      count: data.count
    })).sort((a, b) => b.total - a.total)
  }

  // Get previous period for trend (skip for all range)
  let trends = { total: 0 }
  
  if (range !== 'all') {
    const days = parseInt(range)
    let prevStartDate: Date
    let prevEndDate: Date
    
    if (days === 1) {
      // Previous day
      prevEndDate = new Date(jakartaNow)
      prevEndDate.setDate(prevEndDate.getDate() - 1)
      prevStartDate = new Date(prevEndDate)
    } else if (days >= 365) {
      // Previous 1 year period
      prevEndDate = new Date(jakartaNow)
      prevEndDate.setFullYear(prevEndDate.getFullYear() - 1)
      prevStartDate = new Date(prevEndDate)
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1)
    } else {
      // Previous X days period
      prevEndDate = new Date(jakartaNow)
      prevEndDate.setDate(prevEndDate.getDate() - days)
      prevStartDate = new Date(prevEndDate)
      prevStartDate.setDate(prevStartDate.getDate() - days + 1)
    }

    const prevStartDateStr = prevStartDate.toISOString().split('T')[0]
    const prevEndDateStr = prevEndDate.toISOString().split('T')[0]

    // Query previous period
    let prevQuery = supabaseAdmin
      .from('pengeluaran')
      .select('nominal')
      .eq('user_id', user.id)
      .gte('tanggal', prevStartDateStr)
      .lte('tanggal', prevEndDateStr)

    // Apply kategori filter to previous period too
    if (kategori !== 'semua') {
      prevQuery = prevQuery.eq('kategori', kategori)
    }

    const { data: prevData } = await prevQuery

    const prevTotal = prevData?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0
    const currentTotal = stats.total_pengeluaran

    // Calculate trend percentage
    if (prevTotal === 0) {
      trends.total = currentTotal > 0 ? 100 : 0
    } else {
      trends.total = Math.round(((currentTotal - prevTotal) / prevTotal) * 100)
    }
  }

  // Pagination info
  const totalPages = Math.ceil(totalCount / limit)
  
  return NextResponse.json({
    success: true,
    data: paginatedData,
    stats,
    trends,
    kategoriBreakdown,
    meta: {
      range,
      startDate: startDateStr,
      endDate: endDateStr,
      kategori
    },
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasMore: page < totalPages
    }
  })
}

export async function PUT(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { pengeluaran_id, kategori, nominal, catatan } = body

    if (!pengeluaran_id || !nominal || nominal <= 0) {
      return NextResponse.json({ error: 'pengeluaran_id dan nominal wajib diisi' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('pengeluaran')
      .update({
        kategori: kategori || 'Lainnya',
        nominal: parseInt(nominal),
        catatan: catatan || null,
      })
      .eq('id', pengeluaran_id)
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Gagal update pengeluaran')
    }

    return NextResponse.json({ data, message: 'Pengeluaran berhasil diupdate' })

  } catch (error) {
    console.error('Error update pengeluaran:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const pengeluaran_id = searchParams.get('pengeluaran_id')

    if (!pengeluaran_id) {
      return NextResponse.json({ error: 'pengeluaran_id wajib diisi' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('pengeluaran')
      .delete()
      .eq('id', pengeluaran_id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ message: 'Pengeluaran berhasil dihapus' })

  } catch (error) {
    console.error('Error delete pengeluaran:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}