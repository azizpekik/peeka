import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateWebhookSecret } from '@/lib/utils'

// GET — ambil transaksi by user (untuk dashboard)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const telegram_id = searchParams.get('telegram_id')
    const range = searchParams.get('range') || '1'
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'semua' // semua, cash, piutang
    const search = searchParams.get('search') || '' // search query

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

    // Get current date in Jakarta timezone
    const now = new Date()
    const jakartaOffset = 7 * 60 * 60 * 1000
    const jakartaNow = new Date(now.getTime() + jakartaOffset)
    const today = jakartaNow.toISOString().split('T')[0]

    // Calculate date range
    let startDateStr: string | null = null
    let endDate: string = today
    
    if (range === 'custom' && start && end) {
      startDateStr = start
      endDate = end
    } else if (range === 'all') {
      // Semua data - tidak ada batasan tanggal
      startDateStr = null
      endDate = today
    } else {
      const days = parseInt(range)
      
      if (days === 1) {
        // Hari Ini - only today
        startDateStr = today
      } else if (days >= 365) {
        // 1 Tahun atau lebih - set ke awal tahun
        const startDate = new Date(jakartaNow)
        startDate.setFullYear(startDate.getFullYear() - 1)
        startDateStr = startDate.toISOString().split('T')[0]
      } else {
        // X hari terakhir (including today)
        const startDate = new Date(jakartaNow)
        startDate.setDate(startDate.getDate() - days + 1)
        startDateStr = startDate.toISOString().split('T')[0]
      }
    }

    console.log(`[Transaksi API] Range: ${range}, Status: ${status}, Search: ${search}, Start: ${startDateStr}, End: ${endDate}, Page: ${page}, Limit: ${limit}`)

    // Load all data in date range (with join for search functionality)
    let allDataQuery = supabaseAdmin
      .from('transaksi')
      .select(`
        *,
        transaksi_items (*),
        piutang (status, sisa_hutang)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    // Apply date range filter (skip if 'all')
    if (startDateStr) {
      allDataQuery = allDataQuery.gte('tanggal', startDateStr).lte('tanggal', endDate)
    }
    
    // Apply status filter if not 'semua'
    if (status === 'cash') {
      allDataQuery = allDataQuery.in('status_bayar', ['cash', 'lunas'])
    } else if (status === 'piutang') {
      allDataQuery = allDataQuery.eq('status_bayar', 'piutang')
    }

    const { data: allData, error: allDataError } = await allDataQuery

    if (allDataError) {
      console.error('[Transaksi API] Query error:', allDataError)
      return NextResponse.json({ error: allDataError.message }, { status: 500 })
    }

    // Apply search filter client-side (search in nomor_nota, nama_pelanggan, items)
    let filteredData = allData || []
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter((t: any) => {
        // Search in nomor_nota
        if (t.nomor_nota?.toLowerCase().includes(searchLower)) return true
        // Search in nama_pelanggan
        if (t.nama_pelanggan?.toLowerCase().includes(searchLower)) return true
        // Search in catatan
        if (t.catatan?.toLowerCase().includes(searchLower)) return true
        // Search in transaksi_items
        if (t.transaksi_items?.some((i: any) => i.nama_item?.toLowerCase().includes(searchLower))) return true
        return false
      })
    }

    // Calculate total count after filtering
    const totalCount = filteredData.length

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit
    const paginatedData = filteredData.slice(from, to)

    // Use paginated data for response
    const data = paginatedData

    // Calculate summary stats from ALL filtered data (not just paginated)
    const stats = {
      total_cash: filteredData?.filter((t: any) => t.status_bayar === 'cash' || t.status_bayar === 'lunas')
        .reduce((sum: number, t: any) => sum + (t.total_nominal || 0), 0) || 0,
      total_piutang: filteredData?.filter((t: any) => t.status_bayar === 'piutang')
        .reduce((sum: number, t: any) => sum + (t.total_nominal || 0), 0) || 0,
      total_semua: filteredData?.reduce((sum: number, t: any) => sum + (t.total_nominal || 0), 0) || 0,
      count_cash: filteredData?.filter((t: any) => t.status_bayar === 'cash' || t.status_bayar === 'lunas').length || 0,
      count_piutang: filteredData?.filter((t: any) => t.status_bayar === 'piutang').length || 0,
      count_total: filteredData?.length || 0
    }

    // Get previous period for trend (skip for custom and all ranges)
    let trends = { total: 0, cash: 0, piutang: 0 }
    
    if (range !== 'custom' && range !== 'all') {
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

      let prevQuery = supabaseAdmin
        .from('transaksi')
        .select('total_nominal, status_bayar')
        .eq('user_id', user.id)
        .gte('tanggal', prevStartDate.toISOString().split('T')[0])
        .lte('tanggal', prevEndDate.toISOString().split('T')[0])
      
      // Apply same status filter to previous period
      if (status === 'cash') {
        prevQuery = prevQuery.in('status_bayar', ['cash', 'lunas'])
      } else if (status === 'piutang') {
        prevQuery = prevQuery.eq('status_bayar', 'piutang')
      }
      
      const { data: prevData } = await prevQuery

      const prevStats = {
        total_semua: prevData?.reduce((sum: number, t: any) => sum + (t.total_nominal || 0), 0) || 0,
        total_cash: prevData?.filter((t: any) => t.status_bayar === 'cash' || t.status_bayar === 'lunas')
          .reduce((sum: number, t: any) => sum + (t.total_nominal || 0), 0) || 0,
        total_piutang: prevData?.filter((t: any) => t.status_bayar === 'piutang')
          .reduce((sum: number, t: any) => sum + (t.total_nominal || 0), 0) || 0
      }

      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
      }

      trends = {
        total: calculateTrend(stats.total_semua, prevStats.total_semua),
        cash: calculateTrend(stats.total_cash, prevStats.total_cash),
        piutang: calculateTrend(stats.total_piutang, prevStats.total_piutang)
      }
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      data,
      stats,
      trends,
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasMore: page < totalPages
      },
      meta: {
        range: range === 'custom' || range === 'all' ? range : parseInt(range),
        startDate: startDateStr,
        endDate,
        status
      }
    })

  } catch (error: any) {
    console.error('[Transaksi API] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST — create transaksi
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { telegram_id, items, status_bayar, nama_pelanggan, catatan } = body

    if (!telegram_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Generate nomor nota
    const { data: nomorData } = await supabaseAdmin
      .rpc('generate_nomor_nota', { p_user_id: user.id })

    const nomor_nota = nomorData || `PEEKA-${Date.now()}`

    // Hitung total
    const total_nominal = items.reduce(
      (sum: number, item: { harga: number; qty: number }) => sum + item.harga * item.qty,
      0
    )

    // Insert transaksi
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

    // Insert items
    const itemsToInsert = items.map((item: { nama_item: string; harga: number; qty: number }) => ({
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

    // Insert piutang jika status piutang
    if (status_bayar === 'piutang' && nama_pelanggan) {
      await supabaseAdmin.from('piutang').insert({
        transaksi_id: transaksi.id,
        user_id: user.id,
        nama_pelanggan,
        total_hutang: total_nominal,
        total_terbayar: 0
      })
    }

    return NextResponse.json({
      data: { ...transaksi, items },
      message: 'Transaksi berhasil disimpan'
    })

  } catch (error: any) {
    console.error('Error transaksi:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT — edit transaksi
export async function PUT(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { transaksi_id, items, status_bayar, nama_pelanggan, catatan } = body

    if (!transaksi_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Ambil transaksi lama
    const { data: transaksiLama, error: fetchError } = await supabaseAdmin
      .from('transaksi')
      .select('*')
      .eq('id', transaksi_id)
      .single()

    if (fetchError || !transaksiLama) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // Hitung total baru
    const total_nominal = items.reduce(
      (sum: number, item: { harga: number; qty: number }) => sum + item.harga * item.qty,
      0
    )

    // Update transaksi
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

    // Hapus items lama, insert items baru
    await supabaseAdmin.from('transaksi_items').delete().eq('transaksi_id', transaksi_id)

    const itemsToInsert = items.map((item: { nama_item: string; harga: number; qty: number }) => ({
      transaksi_id,
      nama_item: item.nama_item,
      harga: item.harga,
      qty: item.qty
    }))

    await supabaseAdmin.from('transaksi_items').insert(itemsToInsert)

    // Handle piutang
    const { data: piutang } = await supabaseAdmin
      .from('piutang')
      .select('id')
      .eq('transaksi_id', transaksi_id)
      .single()

    if (piutang) {
      if (status_bayar === 'cash') {
        await supabaseAdmin.from('piutang').delete().eq('transaksi_id', transaksi_id)
      } else {
        await supabaseAdmin.from('piutang').update({
          total_hutang: total_nominal,
          nama_pelanggan: nama_pelanggan || piutang.id
        }).eq('transaksi_id', transaksi_id)
      }
    } else if (status_bayar === 'piutang' && nama_pelanggan) {
      await supabaseAdmin.from('piutang').insert({
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

  } catch (error: any) {
    console.error('Error update transaksi:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
      return NextResponse.json({ error: 'transaksi_id wajib diisi' }, { status: 400 })
    }

    await supabaseAdmin.from('transaksi').delete().eq('id', transaksi_id)

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' })

  } catch (error: any) {
    console.error('Error delete transaksi:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}