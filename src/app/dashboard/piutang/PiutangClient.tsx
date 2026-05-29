'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  ChevronDown, ChevronUp, Plus, X, Clock, Trash2, Search, RefreshCw,
  TrendingUp, AlertTriangle, Receipt, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric'
})
const todayDate = () => new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]

interface PiutangClientProps {
  telegramId: string
}

type SortOption = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name'

const sortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'largest', label: 'Terbesar' },
  { value: 'smallest', label: 'Terkecil' },
  { value: 'name', label: 'Nama A-Z' },
]

// Stat Card Component
const StatCard = ({ label, value, sub, trend, trendLabel, icon: Icon, color, bg, size = 'normal' }: any) => (
  <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${size === 'large' ? 'p-6' : 'p-5'}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className={`font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 ${size === 'large' ? 'text-sm' : 'text-xs'}`}>
          {label}
        </p>
        <p className={`font-bold text-gray-800 dark:text-white/90 ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>
          {value}
        </p>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {trend >= 0 ? <TrendingUp size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-sm font-medium">{trend > 0 ? '+' : ''}{trend}%</span>
            <span className="text-xs text-gray-400 ml-1">{trendLabel}</span>
          </div>
        )}
        {sub && !trend && (
          <p className="text-sm text-gray-400 mt-1">{sub}</p>
        )}
      </div>
      <div className={`flex items-center justify-center rounded-xl ${size === 'large' ? 'w-14 h-14' : 'w-12 h-12'} ${bg}`}>
        <Icon size={size === 'large' ? 24 : 20} className={color} />
      </div>
    </div>
  </div>
)

export default function PiutangClient({ telegramId }: PiutangClientProps) {
  const [piutang, setPiutang] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total_piutang: 0,
    count_piutang: 0,
    total_hutang: 0
  })
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    hasMore: false
  })

  // Search debounce
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const isInitialSearch = useRef(true)

  const [modalPiutang, setModalPiutang] = useState<any | null>(null)
  const [nominalBayar, setNominalBayar] = useState('')
  const [tanggalBayar, setTanggalBayar] = useState(todayDate())
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [deleteModal, setDeleteModal] = useState<{id: number, nominal: number} | null>(null)

  // Sort dropdown
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const load = useCallback(async (refresh = false, pageNum: number = 1, searchQuery: string = debouncedSearch) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const timestamp = Date.now()
      let url = `/api/piutang-transaksi?telegram_id=${telegramId}&sort=${sort}&page=${pageNum}&limit=${limit}&_t=${timestamp}`
      if (searchQuery && searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }
      
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      
      if (json.success) {
        setPiutang(json.data || [])
        setStats(json.stats || { total_piutang: 0, count_piutang: 0, total_hutang: 0 })
        setPagination(json.pagination || { totalCount: 0, totalPages: 1, hasMore: false })
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [telegramId, sort, limit, debouncedSearch])

  // Initial load
  useEffect(() => {
    load(false, 1, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle search debounce
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
    load(false, 1, debouncedSearch)
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sort])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    load(false, newPage)
  }

  const handleNominalChange = (val: string) => {
    const raw = val.replace(/\D/g, '')
    const num = Number(raw) || 0
    const max = modalPiutang?.sisa_hutang || 0
    if (num === 0 || num <= max) {
      setNominalBayar(raw)
    }
  }

  const handleBayar = async () => {
    if (!modalPiutang || !nominalBayar) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/piutang-transaksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.NEXT_PUBLIC_WEBHOOK_SECRET || ''
        },
        body: JSON.stringify({
          transaksi_id: modalPiutang.transaksi_id,
          nominal_bayar: parseInt(nominalBayar.replace(/\D/g, '')),
          tanggal_bayar: tanggalBayar || new Date().toISOString()
        })
      })
      const json = await res.json()
      setSuccessMsg(json.message || 'Berhasil!')
      setTimeout(() => {
        setModalPiutang(null)
        setNominalBayar('')
        setTanggalBayar('')
        setSuccessMsg('')
        load(false, page)
      }, 1500)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBayar = async () => {
    if (!deleteModal) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/piutang-transaksi', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.NEXT_PUBLIC_WEBHOOK_SECRET || ''
        },
        body: JSON.stringify({ pembayaran_id: deleteModal.id })
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setDeleteModal(null)
        load(false, page)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const rataRata = stats.count_piutang > 0 ? Math.round(stats.total_piutang / stats.count_piutang) : 0

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Piutang</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Hutang pelanggan ke warung</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Piutang"
          value={fmt(stats.total_piutang)}
          count={stats.count_piutang}
          icon={AlertTriangle}
          color="text-amber-500"
          bg="bg-amber-50 dark:bg-amber-500/10"
          size="large"
        />
        <StatCard
          label="Jumlah Pelanggan"
          value={String(stats.count_piutang)}
          sub="belum lunas"
          icon={Receipt}
          color="text-blue-500"
          bg="bg-blue-50 dark:bg-blue-500/10"
        />
        <StatCard
          label="Rata-rata"
          value={fmt(rataRata)}
          sub="per pelanggan"
          icon={TrendingUp}
          color="text-purple-500"
          bg="bg-purple-50 dark:bg-purple-500/10"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan atau nomor nota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 min-w-[160px] justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              {sortOptions.find(o => o.value === sort)?.label}
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          
          {isSortOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-50 py-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSort(option.value as SortOption)
                    setIsSortOpen(false)
                  }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm ${
                    sort === option.value ? 'text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-brand-500/10' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={() => load(true, page)}
          disabled={refreshing}
          className="flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {piutang.length} dari {pagination.totalCount} piutang
          </span>
          {debouncedSearch && (
            <span className="text-xs text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-full">
              Cari: "{debouncedSearch}"
            </span>
          )}
        </div>
        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
          {fmtFull(stats.total_piutang)}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Image src="/logo/logo-peeka.png" alt="Loading" width={56} height={56} className="animate-bounce rounded-xl mb-3" />
          <p className="text-sm text-gray-400">Memuat piutang...</p>
        </div>
      ) : piutang.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <AlertTriangle size={48} className="text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-500">Tidak ada piutang aktif</p>
          {debouncedSearch && (
            <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {piutang.map((p: any, idx: number) => {
            const totalHutang = p.total_hutang || 0
            const totalBayar = p.total_bayar || 0
            const progress = totalHutang > 0
              ? Math.round((totalBayar / totalHutang) * 100)
              : 0

            return (
              <div key={p.id} className={idx < piutang.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-amber-600 dark:text-amber-400">
                      {p.nama_pelanggan?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {p.nama_pelanggan || 'Tanpa Nama'}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {p.nomor_nota} · {fmtDate(p.tanggal || p.created_at)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span className="text-xs text-gray-400">{fmtFull(totalBayar)} / {fmtFull(totalHutang)}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          {progress}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progress === 100 ? 'bg-green-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {fmtFull(p.sisa_hutang)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">sisa hutang</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.pembayaran?.length > 0 && (
                        <button
                          onClick={() => setExpanded(expanded === p.transaksi_id ? null : p.transaksi_id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Riwayat pembayaran"
                        >
                          {expanded === p.transaksi_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                      <button
                        onClick={() => setModalPiutang(p)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                      >
                        <Plus size={12} />
                        Bayar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Riwayat bayar */}
                {expanded === p.transaksi_id && p.pembayaran?.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] px-4 py-3 sm:px-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      Riwayat Pembayaran
                    </p>
                    <div className="space-y-2">
                      {p.pembayaran.map((bayar: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                              {fmtFull(bayar.nominal_bayar)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-400">{fmtDate(bayar.tanggal_bayar || bayar.created_at)}</p>
                            <button
                              onClick={() => setDeleteModal({ id: bayar.id, nominal: bayar.nominal_bayar })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Modal Catat Bayar */}
      {modalPiutang && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="absolute inset-0" onClick={() => setModalPiutang(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl z-10">

            {/* Header modal */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-white/90">
                  Catat Pembayaran
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">{modalPiutang.nama_pelanggan}</p>
              </div>
              <button onClick={() => setModalPiutang(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <X size={16} />
              </button>
            </div>

            {/* Info sisa */}
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total hutang</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {fmtFull(modalPiutang.total_hutang)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Sudah dibayar</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {fmtFull(modalPiutang.total_bayar)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1 pt-1 border-t border-amber-200 dark:border-amber-500/20">
                <span className="font-semibold text-amber-700 dark:text-amber-400">Sisa hutang</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {fmtFull(modalPiutang.sisa_hutang)}
                </span>
              </div>
            </div>

            {successMsg ? (
              <div className="flex flex-col items-center py-6">
                <span className="text-4xl mb-2">🎉</span>
                <p className="text-sm font-semibold text-success-600">{successMsg}</p>
              </div>
            ) : (
              <>
                {/* Input nominal */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                    Nominal Bayar
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 50000"
                    value={nominalBayar ? Number(nominalBayar).toLocaleString('id-ID') : ''}
                    onChange={e => handleNominalChange(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                  {Number(nominalBayar) === modalPiutang.sisa_hutang && (
                    <p className="text-xs text-success-500 mt-1">Akan lunas setelah bayar ini</p>
                  )}
                </div>

                {/* Input tanggal */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                    Tanggal Bayar
                  </label>
                  <input
                    type="date"
                    value={tanggalBayar}
                    onChange={e => setTanggalBayar(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalPiutang(null)}
                    className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBayar}
                    disabled={!nominalBayar || submitting}
                    className="flex-1 h-11 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="absolute inset-0" onClick={() => setDeleteModal(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-error-50 dark:bg-error-500/10">
              <Trash2 size={24} className="text-error-500" />
            </div>
            <h3 className="text-base font-bold text-center text-gray-800 dark:text-white/90 mb-2">
              Hapus Pembayaran?
            </h3>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
              Pembayaran {fmtFull(deleteModal.nominal)} akan dihapus. Sisa hutang akan kembali bertambah.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteBayar}
                disabled={submitting}
                className="flex-1 h-11 rounded-xl bg-error-500 text-white text-sm font-semibold hover:bg-error-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}