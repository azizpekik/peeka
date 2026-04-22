'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { RefreshCw, TrendingUp, TrendingDown, Receipt, AlertTriangle, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts'

const TODAY = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]

const fmt = (n: any) => {
  const num = typeof n === 'number' ? n : parseFloat(n) || 0
  return 'Rp ' + num.toLocaleString('id-ID')
}
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

interface DashboardClientProps {
  initialData: any;
  initialPiutang: any[];
  initialPengeluaran: any[];
  telegramId: string;
}

export default function DashboardClient({ initialData, initialPiutang, initialPengeluaran, telegramId }: DashboardClientProps) {
  const [data, setData] = useState<any>(initialData)
  const [piutang, setPiutang] = useState<any[]>(initialPiutang)
  const [pengeluaran, setPengeluaran] = useState<any[]>(initialPengeluaran)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [trendRange, setTrendRange] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [trendData, setTrendData] = useState<any[]>([])
  const [trendLoading, setTrendLoading] = useState(false)

  const load = async (refresh = false, tanggal = selectedDate) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const [l, p, pg, t] = await Promise.all([
        fetch(`/api/laporan?telegram_id=${telegramId}&tanggal=${tanggal}`).then(r => r.json()),
        fetch(`/api/piutang?telegram_id=${telegramId}&status=aktif`).then(r => r.json()),
        fetch(`/api/pengeluaran?telegram_id=${telegramId}&tanggal=${tanggal}`).then(r => r.json()),
        fetch(`/api/trend?telegram_id=${telegramId}&range=${trendRange}`).then(r => r.json())
      ])
      if (l.success) setData(l.data)
      if (p.success) setPiutang(p.data || [])
      if (pg.success) setPengeluaran(pg.data || [])
      if (t.success) setTrendData(t.data?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    load(false, newDate)
  }

  const loadTrend = async (range: 'daily' | 'weekly' | 'monthly') => {
    setTrendLoading(true)
    try {
      const res = await fetch(`/api/trend?telegram_id=${telegramId}&range=${range}`)
      const t = await res.json()
      if (t.success) setTrendData(t.data?.data || [])
    } catch (e) {
      console.error('Trend load error:', e)
    } finally {
      setTrendLoading(false)
    }
  }

  useEffect(() => {
    load(false, selectedDate)
    loadTrend('daily')
  }, [])

  useEffect(() => {
    const timer = setInterval(() => load(true, selectedDate), 30000)
    return () => clearInterval(timer)
  }, [telegramId, selectedDate])

  const namaToko = data?.toko?.nama_toko || 'Dashboard'
  const totalPiutang = piutang.reduce((s: number, p: any) => s + (p.sisa_hutang || p.total_hutang || 0), 0)
  const totalPenjualan = data?.total_pemasukan || 0
  const cashMasuk = data?.total_cash || data?.total_pemasukan || 0
  const totalPengeluaran = data?.total_pengeluaran || 0
  const labaPositif = (totalPenjualan - totalPengeluaran) >= 0
  const rawChartData = data?.chart_data || []
  const chartData = Object.entries(
    rawChartData.reduce((acc: any, curr: any) => {
      const jam = curr.jam?.substring(0, 2) + ':00'
      acc[jam] = (acc[jam] || 0) + (curr.total || 0)
      return acc
    }, {})
  ).map(([jam, total]) => ({ jam, total })).sort((a: any, b: any) => 
    parseInt(a.jam) - parseInt(b.jam)
  )

  return (
    <main className="bg-gray-50 dark:bg-gray-950 pb-20">
      {loading && !data && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Image src="/logo/logo-peeka.png" alt="Loading" width={60} height={60} className="animate-bounce rounded-xl" />
          <p className="text-sm text-gray-400">Memuat data...</p>
        </div>
      )}

      {data && (
        <div className="space-y-5">

        {/* Page Header */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Laporan Harian</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ringkasan penjualan & pengeluaran</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">Pilih Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              />
              <button
                onClick={() => load(true, selectedDate)}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition-all"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col gap-5">

          {/* Stat Cards - 4 Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Penjualan',
                value: fmt(totalPenjualan),
                sub: `${data?.transaksi_list?.length || 0} transaksi`,
                icon: ArrowUpRight,
                color: 'text-brand-500',
                bg: 'bg-brand-50 dark:bg-brand-500/10',
              },
              {
                label: 'Cash Masuk',
                value: fmt(cashMasuk),
                sub: 'sudah diterima',
                icon: TrendingUp,
                color: 'text-success-500',
                bg: 'bg-success-50 dark:bg-success-500/10',
              },
              {
                label: 'Pengeluaran',
                value: fmt(totalPengeluaran),
                sub: 'operasional',
                icon: ArrowDownRight,
                color: 'text-error-500',
                bg: 'bg-error-50 dark:bg-error-500/10',
              },
              {
                label: 'Piutang Aktif',
                value: fmt(totalPiutang),
                sub: `${piutang.length} pelanggan`,
                icon: AlertTriangle,
                color: 'text-warning-500',
                bg: 'bg-warning-50 dark:bg-warning-500/10',
              },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {label}
                </p>
                <p className="text-lg font-bold text-gray-800 dark:text-white/90">
                  {value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Laba Kotor & Trend Chart - 2 Kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Laba Kotor Card */}
            <div className={`rounded-2xl p-5 ${
              labaPositif
                ? 'bg-gray-900 dark:bg-gray-800'
                : 'bg-error-50 border border-error-200 dark:bg-error-500/10 dark:border-error-500/20'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${
                labaPositif ? 'text-gray-400' : 'text-error-400'
              }`}>
                Laba Kotor
              </p>
              <div className="flex items-end gap-2 mb-4">
                <p className={`text-3xl font-bold leading-none ${
                  labaPositif ? 'text-white' : 'text-error-600 dark:text-error-400'
                }`}>
                  {fmt(Math.abs(totalPenjualan - totalPengeluaran))}
                </p>
                {labaPositif
                  ? <TrendingUp size={18} className="text-success-400 mb-1" />
                  : <TrendingDown size={18} className="text-error-500 mb-1" />
                }
              </div>
              <div className={`pt-3 border-t ${labaPositif ? 'border-gray-700' : 'border-error-200 dark:border-error-500/20'}`}>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Jual', val: fmt(totalPenjualan) },
                    { label: 'Keluar', val: fmt(totalPengeluaran) },
                    { label: 'Nota', val: `${data?.transaksi_list?.length || 0}x` },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                        labaPositif ? 'text-gray-500' : 'text-gray-400'
                      }`}>{label}</p>
                      <p className={`text-sm font-bold ${
                        labaPositif ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Tren Penjualan
                </p>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {(['daily', 'weekly', 'monthly'] as const).map(r => (
                    <button key={r} onClick={() => { setTrendRange(r); loadTrend(r) }}
                      className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all ${
                        trendRange === r
                          ? 'bg-brand-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400'
                      }`}>
                      {r === 'daily' ? 'Harian' : r === 'weekly' ? 'Mingguan' : 'Bulanan'}
                    </button>
                  ))}
                </div>
              </div>
              {trendLoading ? (
                <div className="h-36 flex flex-col items-center justify-center text-gray-400">
                  <RefreshCw size={24} className="animate-spin mb-2" />
                  <p className="text-sm">Memuat tren...</p>
                </div>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#98a2b3' }} axisLine={false} tickLine={false}
                      tickFormatter={(v: string) => {
                        const d = new Date(v)
                        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                      }}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v: any, n: any) => [fmtFull(v as number), n === 'penjualan' ? 'Pendapatan' : n === 'pengeluaran' ? 'Pengeluaran' : 'Laba Kotor']}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e4e7ec' }}
                    />
                    <Legend verticalAlign="top" height={20} wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="penjualan" stroke="#465fff" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="laba" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-36 flex flex-col items-center justify-center text-gray-400">
                  <span className="text-3xl mb-2">📈</span>
                  <p className="text-sm">Belum ada data tren</p>
                </div>
              )}
            </div>
          </div>

          {/* Transaksi & Pengeluaran Hari Ini - 2 Kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaksi Hari Ini */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Transaksi Hari Ini
                </p>
                <span className="text-xs text-gray-400">
                  {data?.transaksi_list?.length || 0} nota
                </span>
              </div>

              {(!data?.transaksi_list || data.transaksi_list.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="text-3xl mb-2">🪲</span>
                  <p className="text-sm text-gray-400">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[300px] overflow-y-auto">
                  {data.transaksi_list.slice(0, 10).map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        t.status_bayar === 'cash'
                          ? 'bg-success-50 dark:bg-success-500/10'
                          : 'bg-warning-50 dark:bg-warning-500/10'
                      }`}>
                        {t.status_bayar === 'cash'
                          ? <ArrowUpRight size={14} className="text-success-500" />
                          : <Receipt size={14} className="text-warning-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {t.transaksi_items?.map((i: any) =>
                            `${i.nama_item}${i.qty > 1 ? ` x${i.qty}` : ''}`
                          ).join(', ') || t.nomor_nota || 'Transaksi'}
                        </p>
                        {t.nama_pelanggan && (
                          <p className="text-xs text-warning-500 truncate">{t.nama_pelanggan}</p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90 flex-shrink-0">
                        {fmt(t.total_nominal)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {data?.transaksi_list?.length > 10 && (
                <a href="/dashboard/transaksi" className="flex items-center justify-center gap-1 px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-sm font-medium text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Lihat Selengkapnya <ChevronRight size={14} />
                </a>
              )}
            </div>

            {/* Pengeluaran Hari Ini */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Pengeluaran Hari Ini
                </p>
                <span className="text-xs text-gray-400">
                  {pengeluaran.length || 0} item
                </span>
              </div>

              {!pengeluaran || pengeluaran.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="text-3xl mb-2">✅</span>
                  <p className="text-sm text-gray-400">Tidak ada pengeluaran</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[300px] overflow-y-auto">
                  {pengeluaran.slice(0, 10).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="w-8 h-8 rounded-lg bg-error-50 dark:bg-error-500/10 flex items-center justify-center flex-shrink-0">
                        <ArrowDownRight size={14} className="text-error-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {p.kategori?.replace(/_/g, ' ') || 'Pengeluaran'}
                        </p>
                        {p.catatan && (
                          <p className="text-xs text-gray-400 truncate">{p.catatan}</p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-error-600 dark:text-error-400 flex-shrink-0">
                        {fmt(p.nominal)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {pengeluaran.length > 10 && (
                <a href="/dashboard/pengeluaran" className="flex items-center justify-center gap-1 px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-sm font-medium text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Lihat Selengkapnya <ChevronRight size={14} />
                </a>
              )}
            </div>
          </div>

          {/* Piutang Aktif */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Piutang Aktif
              </p>
              {piutang.length > 0 && (
                <span className="text-xs font-semibold text-warning-500">
                  {fmt(totalPiutang)}
                </span>
              )}
            </div>

            {piutang.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <span className="text-3xl mb-2">✅</span>
                <p className="text-sm text-gray-400">Tidak ada piutang</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {piutang.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-warning-600 dark:text-warning-400">
                      {p.nama_pelanggan ? p.nama_pelanggan[0].toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {p.nama_pelanggan}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-warning-600 dark:text-warning-400 flex-shrink-0">
                      {fmt(p.sisa_hutang || p.total_hutang || 0)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </main>
  )
}