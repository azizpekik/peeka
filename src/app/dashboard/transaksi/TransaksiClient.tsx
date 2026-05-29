'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  Receipt, ChevronDown, ChevronUp,
  Search, Pencil, Trash2, Plus, X, Check,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Calendar, Clock, Wallet, FileText
} from 'lucide-react'

const WEBHOOK_SECRET = process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'peeka-secret-2026'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtDateShort = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

interface Item {
  nama_item: string
  harga: number
  qty: number
  subtotal?: number
}

interface TransaksiClientProps {
  telegramId: string
}

type TimeRange = '1' | '7' | '30' | '365' | 'all' | 'custom'
type FilterType = 'semua' | 'cash' | 'piutang'

const timeRangeOptions = [
  { value: '1', label: 'Hari Ini' },
  { value: '7', label: '7 Hari' },
  { value: '30', label: '30 Hari' },
  { value: '365', label: '1 Tahun' },
  { value: 'all', label: 'Semua' },
]

export default function TransaksiClient({ telegramId }: TransaksiClientProps) {
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1')
  const [filter, setFilter] = useState<FilterType>('semua')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    total_cash: 0,
    total_piutang: 0,
    total_semua: 0,
    count_cash: 0,
    count_piutang: 0,
    count_total: 0
  })
  const [trends, setTrends] = useState({
    total: 0,
    cash: 0,
    piutang: 0
  })
  const [meta, setMeta] = useState<{
    range: number | 'all',
    startDate: string | null,
    endDate: string
  }>({
    range: 1,
    startDate: '',
    endDate: ''
  })

  // Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    hasMore: false
  })

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Edit state
  const [editData, setEditData] = useState<any | null>(null)
  const [editItems, setEditItems] = useState<Item[]>([])
  const [editNamaPelanggan, setEditNamaPelanggan] = useState('')
  const [editStatusBayar, setEditStatusBayar] = useState<'cash' | 'piutang'>('cash')
  const [editCatatan, setEditCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const load = useCallback(async (range: TimeRange, pageNum: number = 1, statusFilter: FilterType = filter, searchQuery: string = search) => {
    setLoading(true)
    try {
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = Date.now()
      let url = `/api/transaksi?telegram_id=${telegramId}&range=${range}&page=${pageNum}&limit=${limit}&status=${statusFilter}&_t=${timestamp}`
      if (searchQuery && searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }
      
      console.log('[TransaksiClient] Fetching:', url)
      
      const res = await fetch(url, { cache: 'no-store' })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[TransaksiClient] API Error:', res.status, errorText)
        throw new Error(`API Error: ${res.status}`)
      }
      
      const text = await res.text()
      if (!text) {
        console.error('[TransaksiClient] Empty response')
        throw new Error('Empty response')
      }
      
      const json = JSON.parse(text)
      console.log('[TransaksiClient] Response:', json.meta, 'Pagination:', json.pagination)
      
      setTransaksi(json.data || [])
      setStats(json.stats || {
        total_cash: 0, total_piutang: 0, total_semua: 0,
        count_cash: 0, count_piutang: 0, count_total: 0
      })
      setTrends(json.trends || { total: 0, cash: 0, piutang: 0 })
      setMeta(json.meta || { range: 1, startDate: '', endDate: '' })
      setPagination(json.pagination || { totalCount: 0, totalPages: 1, hasMore: false })
      setLastUpdated(new Date())
    } catch (e) {
      console.error('[TransaksiClient] Error:', e)
      // Reset data on error
      setTransaksi([])
      setStats({
        total_cash: 0, total_piutang: 0, total_semua: 0,
        count_cash: 0, count_piutang: 0, count_total: 0
      })
      setTrends({ total: 0, cash: 0, piutang: 0 })
      setMeta({ range: 1, startDate: '', endDate: '' })
      setPagination({ totalCount: 0, totalPages: 1, hasMore: false })
    } finally {
      setLoading(false)
    }
  }, [telegramId, limit])

  // Initial load - only run once on mount
  useEffect(() => {
    load('1', 1, 'semua', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange)
    setPage(1) // Reset to page 1 when changing range
    // Small delay to ensure state is updated
    setTimeout(() => {
      load(newRange, 1, filter, search)
    }, 0)
  }

  const handleCustomDateSearch = () => {
    if (!customStartDate || !customEndDate) return
    setTimeRange('custom')
    setPage(1)
    setTimeout(() => {
      load('custom', 1, filter, search)
    }, 0)
  }

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter)
    setPage(1) // Reset to page 1 when changing filter
    setTimeout(() => {
      load(timeRange, 1, newFilter, search)
    }, 0)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setTimeout(() => {
      load(timeRange, newPage, filter, search)
    }, 0)
  }

  // Handle search with debounce
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const isInitialSearch = useRef(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500) // 500ms debounce
    return () => clearTimeout(timer)
  }, [search])

  // Trigger load when debounced search changes
  useEffect(() => {
    // Skip initial render (first time component mounts)
    if (isInitialSearch.current) {
      isInitialSearch.current = false
      return
    }

    load(timeRange, 1, filter, debouncedSearch)
    setPage(1) // Reset to page 1 when search changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Data from server is already filtered, no need for client-side filtering
  const filtered = transaksi

  // ── DELETE ──
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/transaksi?transaksi_id=${deleteId}`, {
        method: 'DELETE',
        headers: { 'x-webhook-secret': WEBHOOK_SECRET }
      })
      setDeleteId(null)
      load(timeRange as TimeRange, page, filter, search)
    } finally {
      setDeleting(false)
    }
  }

  // ── EDIT ──
  const openEdit = (t: any) => {
    setEditData(t)
    setEditItems(t.transaksi_items?.map((i: any) => ({
      nama_item: i.nama_item,
      harga: i.harga,
      qty: i.qty,
    })) || [])
    setEditNamaPelanggan(t.nama_pelanggan || '')
    setEditStatusBayar(t.status_bayar)
    setEditCatatan(t.catatan || '')
    setSaveSuccess(false)
  }

  const closeEdit = () => {
    setEditData(null)
    setEditItems([])
    setSaveSuccess(false)
  }

  const updateItem = (idx: number, field: keyof Item, value: string | number) => {
    setEditItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'nama_item' ? value : Number(value) } : item
    ))
  }

  const addItem = () => {
    setEditItems(prev => [...prev, { nama_item: '', harga: 0, qty: 1 }])
  }

  const removeItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx))
  }

  const editTotal = editItems.reduce((s, i) => s + i.harga * i.qty, 0)

  const handleSave = async () => {
    if (!editData || editItems.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/transaksi', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: JSON.stringify({
          transaksi_id: editData.id,
          items: editItems,
          status_bayar: editStatusBayar,
          nama_pelanggan: editNamaPelanggan || null,
          catatan: editCatatan || null
        })
      })
      const json = await res.json()
      if (json.data) {
        setSaveSuccess(true)
        setTimeout(() => {
          closeEdit()
      load(timeRange as TimeRange, page, filter, search)
        }, 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  // Stat Card Component
  const StatCard = ({ label, value, count, trend, icon: Icon, color, bg }: any) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {label}
          </p>
          <p className="text-xl font-bold text-gray-800 dark:text-white/90">
            {value}
          </p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-xs font-medium">{trend > 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
          {count !== undefined && (
            <p className="text-xs text-gray-400 mt-1">{count} transaksi</p>
          )}
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Transaksi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Riwayat penjualan dan pembelian</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
          <Calendar size={16} className="text-gray-400 ml-2" />
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeRangeChange(option.value as TimeRange)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeRange === option.value
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock size={14} />
            <span>Update: {lastUpdated.toLocaleTimeString('id-ID')}</span>
          </div>
        )}
      </div>

      {/* Custom Date Range Picker */}
      {timeRange === 'custom' && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Dari:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sampai:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={handleCustomDateSearch}
            disabled={!customStartDate || !customEndDate}
            className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Tampilkan
          </button>
        </div>
      )}

      {/* Period Info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Periode: {meta.startDate ? fmtDateShort(meta.startDate) : '-'} - {meta.endDate ? fmtDateShort(meta.endDate) : '-'}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Penjualan"
          value={fmt(stats.total_semua)}
          count={stats.count_total}
          trend={trends.total}
          icon={Wallet}
          color="text-brand-500"
          bg="bg-brand-50 dark:bg-brand-500/10"
        />
        <StatCard
          label="Cash Masuk"
          value={fmt(stats.total_cash)}
          count={stats.count_cash}
          trend={trends.cash}
          icon={ArrowUpRight}
          color="text-green-500"
          bg="bg-green-50 dark:bg-green-500/10"
        />
        <StatCard
          label="Piutang"
          value={fmt(stats.total_piutang)}
          count={stats.count_piutang}
          trend={trends.piutang}
          icon={Receipt}
          color="text-amber-500"
          bg="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          label="Rata-rata"
          value={fmt(stats.count_total > 0 ? stats.total_semua / stats.count_total : 0)}
          count={stats.count_total}
          icon={TrendingUp}
          color="text-purple-500"
          bg="bg-purple-50 dark:bg-purple-500/10"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nota, item, atau pelanggan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {(['semua', 'cash', 'piutang'] as const).map(f => (
            <button key={f} onClick={() => handleFilterChange(f)}
              className={`px-5 py-2.5 text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400'
              }`}>
              {f === 'semua' ? 'Semua' : f === 'cash' ? 'Cash' : 'Piutang'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {filtered.length} dari {pagination.totalCount} transaksi
          </span>
          {filter !== 'semua' && (
            <span className="text-xs text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-full capitalize">
              {filter}
            </span>
          )}
          {debouncedSearch && (
            <span className="text-xs text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-full">
              Cari: "{debouncedSearch}"
            </span>
          )}
        </div>
        <span className="text-lg font-bold text-gray-800 dark:text-white/90">
          {fmtFull(filtered.reduce((s: number, t: any) => s + (t.total_nominal || 0), 0))}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Image src="/logo/logo-peeka.png" alt="Loading" width={56} height={56} className="animate-bounce rounded-xl mb-3" />
          <p className="text-sm text-gray-400">Memuat transaksi...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <Receipt size={48} className="text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-500">Tidak ada transaksi</p>
          <p className="text-xs text-gray-400 mt-1">Coba ubah filter atau periode waktu</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {filtered.map((t: any, idx: number) => (
            <div key={t.id} className={idx < filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>
              {/* Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                <button
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    t.status_bayar === 'cash' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-amber-50 dark:bg-amber-500/10'
                  }`}>
                    <Receipt size={15} className={t.status_bayar === 'cash' ? 'text-green-500' : 'text-amber-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {t.transaksi_items?.map((i: any) => `${i.nama_item}${i.qty > 1 ? ` x${i.qty}` : ''}`).join(', ')}
                    </p>
                    {t.nama_pelanggan && (
                      <p className="text-xs text-amber-500 truncate mt-0.5 font-medium">
                        {t.nama_pelanggan}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                      <span className="text-xs text-gray-400">{t.nomor_nota}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap ${
                        t.status_bayar === 'cash'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {t.status_bayar}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDate(t.created_at)}</span>
                    </div>
                  </div>
                </button>
                
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90 sm:mr-2">
                    {fmt(t.total_nominal)}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/api/nota?nomor_nota=${t.nomor_nota}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Lihat Nota PDF"
                    >
                      <FileText size={14} className="sm:w-4 sm:h-4" />
                    </a>
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                    >
                      <Pencil size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {expanded === t.id && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 bg-gray-50 dark:bg-gray-800/50">
                  <div className="pt-2 space-y-2">
                    {t.transaksi_items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.nama_item} x {item.qty}
                        </span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {fmt(item.harga * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between font-medium">
                      <span className="text-gray-700 dark:text-gray-300">Total</span>
                      <span className="text-gray-900 dark:text-white">{fmt(t.total_nominal)}</span>
                    </div>
                    {t.catatan && (
                      <p className="text-xs text-gray-500 mt-2 italic">Catatan: {t.catatan}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination - show if there are more pages */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 sm:px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Halaman {page} dari {pagination.totalPages}
            <span className="ml-2 text-xs">({pagination.totalCount} total)</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <span className="sm:hidden">←</span>
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {(() => {
                // Generate unique page numbers
                const totalPages = pagination.totalPages
                const currentPage = page
                let pages: number[] = []
                
                if (totalPages <= 3) {
                  // Show all pages
                  pages = Array.from({ length: totalPages }, (_, i) => i + 1)
                } else {
                  // Show pages around current page
                  if (currentPage <= 2) {
                    pages = [1, 2, 3]
                  } else if (currentPage >= totalPages - 1) {
                    pages = [totalPages - 2, totalPages - 1, totalPages]
                  } else {
                    pages = [currentPage - 1, currentPage, currentPage + 1]
                  }
                }
                
                return pages.map((pageNum) => (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-brand-500 text-white'
                        : 'text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))
              })()}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.totalPages}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <span className="sm:hidden">→</span>
              <span className="hidden sm:inline">Selanjutnya</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hapus Transaksi?</h3>
            <p className="text-sm text-gray-500 mb-4">Transaksi akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Transaksi</h3>
              <button onClick={closeEdit} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-xl text-sm flex items-center gap-2">
                <Check size={16} />
                Transaksi berhasil diupdate!
              </div>
            )}

            <div className="space-y-4">
              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items</label>
                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={item.nama_item}
                        onChange={e => updateItem(idx, 'nama_item', e.target.value)}
                        placeholder="Nama item"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      />
                      <input
                        type="number"
                        value={item.harga}
                        onChange={e => updateItem(idx, 'harga', e.target.value)}
                        placeholder="Harga"
                        className="w-24 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      />
                      <input
                        type="number"
                        value={item.qty}
                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                        placeholder="Qty"
                        className="w-16 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      />
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="mt-2 flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium"
                >
                  <Plus size={16} /> Tambah Item
                </button>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{fmt(editTotal)}</span>
              </div>

              {/* Status & Customer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Bayar</label>
                  <select
                    value={editStatusBayar}
                    onChange={e => setEditStatusBayar(e.target.value as 'cash' | 'piutang')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="cash">Cash</option>
                    <option value="piutang">Piutang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Pelanggan</label>
                  <input
                    type="text"
                    value={editNamaPelanggan}
                    onChange={e => setEditNamaPelanggan(e.target.value)}
                    placeholder="(Opsional)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
                <textarea
                  value={editCatatan}
                  onChange={e => setEditCatatan(e.target.value)}
                  placeholder="(Opsional)"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeEdit}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || editItems.length === 0}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
