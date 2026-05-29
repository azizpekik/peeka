'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  TrendingDown, Search, Pencil, Trash2, X, Check,
  ChevronDown, Wallet, ArrowUpRight, ArrowDownRight,
  Filter, Calendar, Clock, TrendingUp, Receipt
} from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtDateShort = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const kategoriConfig: Record<string, { label: string }> = {
  'Transportasi':          { label: 'Transportasi' },
  'Bahan Baku':           { label: 'Bahan Baku' },
  'Gaji Karyawan':        { label: 'Gaji Karyawan' },
  'Internet dan Komunikasi': { label: 'Internet dan Komunikasi' },
  'Listrik dan Air':      { label: 'Listrik dan Air' },
  'Alat Tulis Kantor':   { label: 'Alat Tulis Kantor' },
  'Pemasaran':           { label: 'Pemasaran' },
  'Pemeliharaan':        { label: 'Pemeliharaan' },
  'Sewa Tempat':         { label: 'Sewa Tempat' },
  'Perizinan dan Pajak': { label: 'Perizinan dan Pajak' },
  'Lainnya':             { label: 'Lainnya' },
}

const getKategoriLabel = (kat: string) => {
  return kategoriConfig[kat]?.label || kat || 'Lainnya'
}

const COLOR_MAP = [
  { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-200' },
  { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-500', border: 'border-green-200' },
  { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-200' },
  { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-200' },
  { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-200' },
  { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-200' },
  { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-200' },
  { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-500', border: 'border-red-200' },
  { bg: 'bg-yellow-50 dark:bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-200' },
  { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-200' },
  { bg: 'bg-gray-50 dark:bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-200' },
]

const getKategoriColor = (kat: string) => {
  let hash = 0
  for (let i = 0; i < kat.length; i++) {
    hash = kat.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLOR_MAP[Math.abs(hash) % COLOR_MAP.length]
}

const kategoriOptions = Object.entries(kategoriConfig).map(([value, { label }]) => ({ value, label }))

type TimeRange = '1' | '7' | '30' | '365' | 'all'

const timeRangeOptions = [
  { value: '1', label: 'Hari Ini' },
  { value: '7', label: '7 Hari' },
  { value: '30', label: '30 Hari' },
  { value: '365', label: '1 Tahun' },
  { value: 'all', label: 'Semua' },
]

interface PengeluaranClientProps {
  telegramId: string
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
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 mt-1 ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
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

export default function PengeluaranClient({ telegramId }: PengeluaranClientProps) {
  const [pengeluaran, setPengeluaran] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1')
  const [kategoriFilter, setKategoriFilter] = useState<string>('semua')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total_pengeluaran: 0,
    count_pengeluaran: 0
  })
  const [trends, setTrends] = useState({ total: 0 })
  const [kategoriBreakdown, setKategoriBreakdown] = useState<any[]>([])
  const [meta, setMeta] = useState<{
    range: number | 'all',
    startDate: string | null,
    endDate: string | null,
    kategori: string
  }>({
    range: 1,
    startDate: '',
    endDate: '',
    kategori: 'semua'
  })

  // Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    hasMore: false
  })

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Edit
  const [editData, setEditData] = useState<any | null>(null)
  const [editKategori, setEditKategori] = useState('Lainnya')
  const [editNominal, setEditNominal] = useState('')
  const [editCatatan, setEditCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Kategori dropdown
  const [isKategoriOpen, setIsKategoriOpen] = useState(false)
  const kategoriDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kategoriDropdownRef.current && !kategoriDropdownRef.current.contains(event.target as Node)) {
        setIsKategoriOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const load = useCallback(async (range: TimeRange, pageNum: number = 1, katFilter: string = kategoriFilter, searchQuery: string = search) => {
    setLoading(true)
    try {
      const timestamp = Date.now()
      let url = `/api/pengeluaran?telegram_id=${telegramId}&range=${range}&page=${pageNum}&limit=${limit}&kategori=${katFilter}&_t=${timestamp}`
      if (searchQuery && searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }
      
      const res = await fetch(url, { cache: 'no-store' })
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`)
      }
      
      const json = await res.json()
      
      setPengeluaran(json.data || [])
      setStats(json.stats || { total_pengeluaran: 0, count_pengeluaran: 0 })
      setTrends(json.trends || { total: 0 })
      setKategoriBreakdown(json.kategoriBreakdown || [])
      setMeta(json.meta || { range: 1, startDate: '', endDate: '', kategori: 'semua' })
      setPagination(json.pagination || { totalCount: 0, totalPages: 1, hasMore: false })
      setLastUpdated(new Date())
    } catch (e) {
      console.error('[PengeluaranClient] Error:', e)
      setPengeluaran([])
      setStats({ total_pengeluaran: 0, count_pengeluaran: 0 })
      setTrends({ total: 0 })
      setKategoriBreakdown([])
    } finally {
      setLoading(false)
    }
  }, [telegramId, limit])

  // Initial load
  useEffect(() => {
    load('1', 1, 'semua', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange)
    setPage(1)
    setTimeout(() => {
      load(newRange, 1, kategoriFilter, search)
    }, 0)
  }

  const handleKategoriChange = (newKategori: string) => {
    setKategoriFilter(newKategori)
    setPage(1)
    setTimeout(() => {
      load(timeRange, 1, newKategori, search)
    }, 0)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setTimeout(() => {
      load(timeRange, newPage, kategoriFilter, search)
    }, 0)
  }

  // Handle search with debounce
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const isInitialSearch = useRef(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false
      return
    }

    load(timeRange, 1, kategoriFilter, debouncedSearch)
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/pengeluaran?pengeluaran_id=${deleteId}`, {
        method: 'DELETE',
        headers: { 'x-webhook-secret': process.env.NEXT_PUBLIC_WEBHOOK_SECRET || '' }
      })
      setDeleteId(null)
      load(timeRange as TimeRange, page, kategoriFilter, search)
    } finally {
      setDeleting(false)
    }
  }

  // Edit
  const openEdit = (p: any) => {
    setEditData(p)
    const cat = p.kategori || ''
    const match = Object.keys(kategoriConfig).find(k => k === cat || kategoriConfig[k].label === cat) || cat
    setEditKategori(match || 'Lainnya')
    setEditNominal(String(p.nominal))
    setEditCatatan(p.catatan || '')
    setSaveSuccess(false)
  }

  const closeEdit = () => {
    setEditData(null)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!editData || !editNominal) return
    setSaving(true)
    try {
      const res = await fetch('/api/pengeluaran', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.NEXT_PUBLIC_WEBHOOK_SECRET || ''
        },
        body: JSON.stringify({
          pengeluaran_id: editData.id,
          kategori: editKategori,
          nominal: parseInt(editNominal),
          catatan: editCatatan || null
        })
      })
      const json = await res.json()
      if (json.data) {
        setSaveSuccess(true)
        setTimeout(() => { closeEdit(); load(timeRange as TimeRange, page, kategoriFilter, search) }, 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Pengeluaran</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Biaya operasional</p>
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

      {/* Period Info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Periode: {meta.startDate ? fmtDateShort(meta.startDate) : '-'} - {meta.endDate ? fmtDateShort(meta.endDate) : '-'}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Pengeluaran"
          value={fmt(stats.total_pengeluaran)}
          count={stats.count_pengeluaran}
          trend={trends.total}
          icon={Wallet}
          color="text-red-500"
          bg="bg-red-50 dark:bg-red-500/10"
        />
        <StatCard
          label="Rata-rata"
          value={fmt(stats.count_pengeluaran > 0 ? stats.total_pengeluaran / stats.count_pengeluaran : 0)}
          count={stats.count_pengeluaran}
          icon={TrendingUp}
          color="text-purple-500"
          bg="bg-purple-50 dark:bg-purple-500/10"
        />
        <StatCard
          label="Transaksi"
          value={String(stats.count_pengeluaran)}
          count={undefined}
          icon={Receipt}
          color="text-blue-500"
          bg="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari catatan atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        
        {/* Custom Kategori Dropdown with Badge */}
        <div className="relative" ref={kategoriDropdownRef}>
          <button
            onClick={() => setIsKategoriOpen(!isKategoriOpen)}
            className="h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 min-w-[180px] justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              {kategoriFilter === 'semua' ? 'Semua Kategori' : getKategoriLabel(kategoriFilter)}
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isKategoriOpen ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          
          {isKategoriOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-50 py-2 max-h-80 overflow-y-auto">
              {/* Semua option */}
              <button
                onClick={() => {
                  handleKategoriChange('semua')
                  setIsKategoriOpen(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between ${
                  kategoriFilter === 'semua' ? 'bg-brand-50 dark:bg-brand-500/10' : ''
                }`}
              >
                <span className={`text-sm font-medium ${kategoriFilter === 'semua' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Semua Kategori
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {stats.count_pengeluaran}
                </span>
              </button>
              
              <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>
              
              {/* Kategori options with badge */}
              {kategoriBreakdown.map((item) => (
                <button
                  key={item.kategori}
                  onClick={() => {
                    handleKategoriChange(item.kategori)
                    setIsKategoriOpen(false)
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between ${
                    kategoriFilter === item.kategori ? 'bg-brand-50 dark:bg-brand-500/10' : ''
                  }`}
                >
                  <span className={`text-sm font-medium ${kategoriFilter === item.kategori ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {getKategoriLabel(item.kategori)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {fmt(item.total)}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full min-w-[24px] text-center">
                      {item.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {pengeluaran.length} dari {pagination.totalCount} pengeluaran
          </span>
          {kategoriFilter !== 'semua' && (
            <span className="text-xs text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-full capitalize">
              {getKategoriLabel(kategoriFilter)}
            </span>
          )}
          {debouncedSearch && (
            <span className="text-xs text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-full">
              Cari: "{debouncedSearch}"
            </span>
          )}
        </div>
        <span className="text-lg font-bold text-gray-800 dark:text-white/90">
          {fmtFull(pengeluaran.reduce((s: number, p: any) => s + (p.nominal || 0), 0))}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Image src="/logo/logo-peeka.png" alt="Loading" width={56} height={56} className="animate-bounce rounded-xl mb-3" />
          <p className="text-sm text-gray-400">Memuat pengeluaran...</p>
        </div>
      ) : pengeluaran.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <TrendingDown size={48} className="text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-500">Tidak ada pengeluaran</p>
          <p className="text-xs text-gray-400 mt-1">Coba ubah filter atau periode waktu</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {pengeluaran.map((p: any, idx: number) => {
            const label = getKategoriLabel(p.kategori)
            const color = getKategoriColor(p.kategori)
            return (
              <div key={p.id} className={idx < pengeluaran.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color.bg}`}>
                      <TrendingDown size={15} className={color.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {label}
                      </p>
                      {p.catatan && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {p.catatan}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap ${color.bg} ${color.text}`}>
                          {label}
                        </span>
                        <span className="text-xs text-gray-400">{fmtDate(p.tanggal)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-base font-bold text-red-500">-{fmt(p.nominal)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
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
                const totalPages = pagination.totalPages
                const currentPage = page
                let pages: number[] = []
                
                if (totalPages <= 3) {
                  pages = Array.from({ length: totalPages }, (_, i) => i + 1)
                } else {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hapus Pengeluaran?</h3>
            <p className="text-sm text-gray-500 mb-4">Pengeluaran akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Pengeluaran</h3>
              <button onClick={closeEdit} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-xl text-sm flex items-center gap-2">
                <Check size={16} />
                Pengeluaran berhasil diupdate!
              </div>
            )}

            <div className="space-y-4">
              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Kategori
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {kategoriOptions.map(({ value, label }) => (
                    <button key={value}
                      onClick={() => setEditKategori(value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        editKategori === value
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Nominal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                  <input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(e.target.value)}
                    placeholder="0"
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Catatan
                </label>
                <input
                  type="text"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  placeholder="Catatan opsional..."
                  className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeEdit}
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editNominal || parseInt(editNominal) <= 0}
                className="flex-1 h-11 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}