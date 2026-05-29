'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight,
  Calendar,
  Download,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  LineChart, 
  Line, 
  Legend,
  PieChart as RePieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts'
import html2canvas from 'html2canvas'

const TODAY = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]

const fmt = (n: any) => {
  const num = typeof n === 'number' ? n : parseFloat(n) || 0
  return 'Rp ' + num.toLocaleString('id-ID')
}
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const fmtDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}
const fmtDateLong = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface DashboardClientProps {
  initialData: any;
  initialPiutang: any[];
  initialPengeluaran: any[];
  telegramId: string;
}

type TimeRange = '1' | '7' | '30' | '365' | 'all'

const timeRangeOptions = [
  { value: '1', label: 'Hari Ini' },
  { value: '7', label: '7 Hari' },
  { value: '30', label: '30 Hari' },
  { value: '365', label: '1 Tahun' },
  { value: 'all', label: 'Semua' },
]

export default function DashboardClient({ initialData, initialPiutang, initialPengeluaran, telegramId }: DashboardClientProps) {
  const [data, setData] = useState<any>(initialData)
  const [piutang, setPiutang] = useState<any[]>(initialPiutang)
  const [pengeluaran, setPengeluaran] = useState<any[]>(initialPengeluaran)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('7')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  
  const trendChartRef = useRef<HTMLDivElement>(null)
  const donutChartRef = useRef<HTMLDivElement>(null)

  const load = async (refresh = false, range = timeRange) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const [l, p, pg] = await Promise.all([
        fetch(`/api/laporan?telegram_id=${telegramId}&range=${range}`).then(r => r.json()),
        fetch(`/api/piutang-transaksi?telegram_id=${telegramId}&status=aktif`).then(r => r.json()),
        fetch(`/api/pengeluaran?telegram_id=${telegramId}&tanggal=${TODAY}`).then(r => r.json())
      ])
      if (l.success) {
        setData(l.data)
        setLastUpdated(new Date())
      }
      if (p.success) setPiutang(p.data || [])
      if (pg.success) setPengeluaran(pg.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load(false, '7')
    // Set lastUpdated on client side only to avoid hydration mismatch
    setLastUpdated(new Date())
  }, [])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => load(true, timeRange), 30000)
    return () => clearInterval(timer)
  }, [telegramId, timeRange, autoRefresh])

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range)
    load(false, range)
  }

  const handleExportChart = async (chartRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!chartRef.current) return
    setExporting(filename)
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      const link = document.createElement('a')
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Error exporting chart:', err)
    } finally {
      setExporting(null)
    }
  }

  const namaToko = data?.toko?.nama_toko || 'Dashboard'
  const totalPiutang = piutang.reduce((s: number, p: any) => s + (p.sisa_hutang || p.total_hutang || 0), 0)
  const totalPenjualan = data?.total_pemasukan || 0
  const cashMasuk = data?.total_cash || 0
  const totalPengeluaran = data?.total_pengeluaran || 0
  const labaKotor = totalPenjualan - totalPengeluaran
  const labaPositif = labaKotor >= 0

  // Chart data
  const trendData = data?.chart_data || []
  const kategoriData = data?.kategori_pengeluaran || []

  // Colors for donut chart
  const donutColors = ['#465fff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  const StatCard = ({ 
    label, 
    value, 
    sub, 
    trend, 
    trendLabel,
    icon: Icon, 
    color, 
    bg,
    size = 'normal'
  }: any) => (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${size === 'large' ? 'p-6' : 'p-5'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 ${size === 'large' ? 'text-sm' : 'text-xs'}`}>
            {label}
          </p>
          <p className={`font-bold text-gray-800 dark:text-white/90 ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>
            {value}
          </p>
          
          {/* Trend indicator */}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
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

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Image src="/logo/logo-peeka.png" alt="Loading" width={60} height={60} className="animate-bounce rounded-xl" />
        <p className="text-sm text-gray-400">Memuat data...</p>
      </div>
    )
  }

  return (
    <main className="bg-gray-50 dark:bg-gray-950 pb-20">
      {data && (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="w-full mx-auto py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Ringkasan Bisnis</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {timeRange === '1' ? 'Hari ini' : timeRange === 'all' ? 'Semua data' : timeRange === '365' ? '1 tahun terakhir' : `${timeRange} hari terakhir`}
                  </p>
                </div>
                
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Time Range Selector */}
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

                  {/* Auto Refresh Toggle */}
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                      autoRefresh
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                    title="Auto-refresh setiap 30 detik"
                  >
                    <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
                  </button>

                  {/* Manual Refresh */}
                  <button
                    onClick={() => load(true, timeRange)}
                    disabled={refreshing}
                    className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Date Range Info */}
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
                <Clock size={14} />
                <span>Periode: {data?.meta?.startDate ? fmtDateLong(data.meta.startDate) : '-'} - {data?.meta?.endDate ? fmtDateLong(data.meta.endDate) : '-'}</span>
                {lastUpdated && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Update: {lastUpdated.toLocaleTimeString('id-ID')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="w-full mx-auto space-y-6">
            {/* Primary Stats - Penjualan & Laba */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                label="Total Penjualan"
                value={fmt(totalPenjualan)}
                trend={data?.trends?.pemasukan}
                trendLabel="vs periode sebelumnya"
                icon={ArrowUpRight}
                color="text-brand-500"
                bg="bg-brand-50 dark:bg-brand-500/10"
                size="large"
              />
              <StatCard
                label="Laba Kotor"
                value={fmt(Math.abs(labaKotor))}
                trend={data?.trends?.laba}
                trendLabel="vs periode sebelumnya"
                icon={labaPositif ? TrendingUp : TrendingDown}
                color={labaPositif ? 'text-green-500' : 'text-red-500'}
                bg={labaPositif ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}
                size="large"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Cash Masuk"
                value={fmt(cashMasuk)}
                sub={`${data?.transaksi_list?.length || 0} transaksi`}
                icon={TrendingUp}
                color="text-green-500"
                bg="bg-green-50 dark:bg-green-500/10"
              />
              <StatCard
                label="Pengeluaran"
                value={fmt(totalPengeluaran)}
                trend={data?.trends?.pengeluaran}
                trendLabel="vs kemarin"
                icon={ArrowDownRight}
                color="text-red-500"
                bg="bg-red-50 dark:bg-red-500/10"
              />
              <StatCard
                label="Piutang Aktif"
                value={fmt(totalPiutang)}
                sub={`${piutang.length} pelanggan`}
                icon={AlertTriangle}
                color="text-amber-500"
                bg="bg-amber-50 dark:bg-amber-500/10"
              />
              <StatCard
                label="Total Transaksi"
                value={data?.meta?.total_transaksi || 0}
                sub="nota tercatat"
                icon={Receipt}
                color="text-purple-500"
                bg="bg-purple-50 dark:bg-purple-500/10"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Chart */}
              <div ref={trendChartRef} className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Tren {timeRange === '1' ? 'Harian' : timeRange === '7' ? 'Mingguan' : timeRange === '365' ? 'Tahunan' : timeRange === 'all' ? 'Keseluruhan' : 'Bulanan'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Penjualan, Laba, dan Pengeluaran</p>
                  </div>
                  <button
                    onClick={() => handleExportChart(trendChartRef, 'trend-penjualan')}
                    disabled={exporting === 'trend-penjualan'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Download size={14} />
                    {exporting === 'trend-penjualan' ? '...' : 'Export'}
                  </button>
                </div>
                
                {trendData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorPenjualan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#465fff" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#465fff" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis 
                          dataKey="tanggal" 
                          tick={{ fontSize: 11, fill: '#98a2b3' }} 
                          axisLine={false} 
                          tickLine={false}
                          tickFormatter={(v: string) => fmtDate(v)}
                        />
                        <YAxis 
                          hide 
                          tickFormatter={(v: number) => `Rp${(v / 1000000).toFixed(0)}jt`}
                        />
                        <Tooltip
                          formatter={(v: any, n: any) => [fmtFull(v as number), n === 'penjualan' ? 'Penjualan' : n === 'pengeluaran' ? 'Pengeluaran' : 'Laba']}
                          labelFormatter={(v: string) => fmtDateLong(v)}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7ec' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                        <Area 
                          type="monotone" 
                          dataKey="penjualan" 
                          stroke="#465fff" 
                          fillOpacity={1} 
                          fill="url(#colorPenjualan)" 
                          strokeWidth={2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="laba" 
                          stroke="#22c55e" 
                          fillOpacity={1} 
                          fill="url(#colorLaba)" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pengeluaran" 
                          stroke="#ef4444" 
                          strokeWidth={2} 
                          dot={false}
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <BarChart3 size={48} className="mb-2 opacity-50" />
                    <p className="text-sm">Belum ada data tren</p>
                  </div>
                )}
              </div>

              {/* Kategori Pengeluaran Donut Chart */}
              <div ref={donutChartRef} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Kategori Pengeluaran
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Distribusi berdasarkan jenis</p>
                  </div>
                  <button
                    onClick={() => handleExportChart(donutChartRef, 'kategori-pengeluaran')}
                    disabled={exporting === 'kategori-pengeluaran'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Download size={14} />
                    {exporting === 'kategori-pengeluaran' ? '...' : 'Export'}
                  </button>
                </div>

                {kategoriData.length > 0 ? (
                  <div className="flex flex-col">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={kategoriData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {kategoriData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string) => [fmtFull(value), name]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7ec' }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto px-1">
                      {kategoriData.slice(0, 6).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: donutColors[idx % donutColors.length] }}
                            />
                            <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200 ml-2 flex-shrink-0">{fmt(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <PieChart size={48} className="mb-2 opacity-50" />
                    <p className="text-sm">Belum ada pengeluaran</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions & Active Debts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white/90">Transaksi Terbaru</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeRange === '1' ? 'Hari ini' : timeRange === 'all' ? 'Semua data' : timeRange === '365' ? '1 tahun terakhir' : `${timeRange} hari terakhir`}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {data?.transaksi_list?.length || 0} nota
                  </span>
                </div>

                {(!data?.transaksi_list || data.transaksi_list.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Receipt size={48} className="text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-sm text-gray-400">Belum ada transaksi</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[320px] overflow-y-auto">
                    {data.transaksi_list.slice(0, 8).map((t: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          t.status_bayar === 'cash' || t.status_bayar === 'lunas'
                            ? 'bg-green-50 dark:bg-green-500/10'
                            : 'bg-amber-50 dark:bg-amber-500/10'
                        }`}>
                          {t.status_bayar === 'cash' || t.status_bayar === 'lunas'
                            ? <ArrowUpRight size={18} className="text-green-500" />
                            : <Receipt size={18} className="text-amber-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {t.transaksi_items?.map((i: any) =>
                              `${i.nama_item}${i.qty > 1 ? ` x${i.qty}` : ''}`
                            ).join(', ') || t.nomor_nota || 'Transaksi'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{fmtDate(t.tanggal)}</span>
                            {t.nama_pelanggan && (
                              <span className="text-xs text-amber-500">• {t.nama_pelanggan}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90 flex-shrink-0">
                          {fmt(t.total_nominal)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {data?.transaksi_list?.length > 8 && (
                  <a href="/dashboard/transaksi" className="flex items-center justify-center gap-1 px-6 py-4 border-t border-gray-100 dark:border-gray-800 text-sm font-medium text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Lihat Semua Transaksi <ChevronRight size={16} />
                  </a>
                )}
              </div>

              {/* Active Debts */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white/90">Piutang Aktif</p>
                    <p className="text-xs text-gray-400 mt-0.5">Daftar pelanggan yang masih berhutang</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">
                    {fmt(totalPiutang)}
                  </span>
                </div>

                {piutang.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <CheckCircle size={48} className="text-green-200 dark:text-green-900/30 mb-3" />
                    <p className="text-sm text-gray-400">Tidak ada piutang aktif</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[320px] overflow-y-auto">
                    {piutang.slice(0, 6).map((p: any) => (
                      <div key={p.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {p.nama_pelanggan}
                          </p>
                          <p className="text-sm font-bold text-amber-600">
                            {fmt(p.sisa_hutang || p.total_hutang)}
                          </p>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all"
                            style={{ width: `${((p.total_hutang - (p.sisa_hutang || 0)) / p.total_hutang) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-400">
                            Dibayar: {fmt(p.total_hutang - (p.sisa_hutang || 0))} / {fmt(p.total_hutang)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {Math.round(((p.total_hutang - (p.sisa_hutang || 0)) / p.total_hutang) * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {piutang.length > 6 && (
                  <a href="/dashboard/piutang" className="flex items-center justify-center gap-1 px-6 py-4 border-t border-gray-100 dark:border-gray-800 text-sm font-medium text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Lihat Semua Piutang <ChevronRight size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
