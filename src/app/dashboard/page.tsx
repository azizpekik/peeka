'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Receipt, AlertTriangle } from 'lucide-react'

const TELEGRAM_ID = '387564171'
const TODAY = new Date().toISOString().split('T')[0]

const fmt = (n: number) => {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt'
  if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + 'rb'
  return 'Rp ' + n
}
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [piutang, setPiutang] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const [l, p] = await Promise.all([
        fetch(`/api/laporan?telegram_id=${TELEGRAM_ID}&tanggal=${TODAY}`).then(r => r.json()),
        fetch(`/api/piutang?telegram_id=${TELEGRAM_ID}&status=aktif`).then(r => r.json()),
      ])
      setData(l.data)
      setPiutang(p.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const rekap = data?.rekap
  const transaksi: any[] = data?.transaksi || []
  const namaToko: string = data?.toko?.nama_toko || 'Dashboard'
  const totalPiutang = piutang.reduce((s: number, p: any) => s + p.sisa_hutang, 0)
  const labaPositif = (rekap?.laba_kotor || 0) >= 0

  const chartData = transaksi.reduce((acc: any[], t: any) => {
    const jam = t.waktu ? parseInt(t.waktu.split(':')[0]) : new Date(t.created_at).getHours()
    const label = `${jam}:00`
    const ex = acc.find((d: any) => d.jam === label)
    if (ex) ex.omset += t.total_nominal
    else acc.push({ jam: label, omset: t.total_nominal })
    return acc
  }, []).sort((a: any, b: any) => parseInt(a.jam) - parseInt(b.jam))

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <span className="text-5xl animate-bounce">🪲</span>
      <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data warung...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Laporan Hari Ini
          </p>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {namaToko}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 transition-all"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total Penjualan',
            value: fmt(rekap?.total_penjualan || 0),
            sub: `${rekap?.jumlah_transaksi || 0} transaksi`,
            icon: ArrowUpRight,
            color: 'text-brand-500',
            bg: 'bg-brand-50 dark:bg-brand-500/10',
          },
          {
            label: 'Cash Masuk',
            value: fmt(rekap?.total_cash || 0),
            sub: 'sudah diterima',
            icon: TrendingUp,
            color: 'text-success-500',
            bg: 'bg-success-50 dark:bg-success-500/10',
          },
          {
            label: 'Pengeluaran',
            value: fmt(rekap?.total_pengeluaran || 0),
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
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-4`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-xl font-bold text-gray-800 dark:text-white/90">
              {value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Laba Kotor Card */}
        <div className={`rounded-2xl p-6 lg:col-span-1 ${
          labaPositif
            ? 'bg-gray-900 dark:bg-gray-800'
            : 'bg-error-50 border border-error-200 dark:bg-error-500/10 dark:border-error-500/20'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${
            labaPositif ? 'text-gray-400' : 'text-error-400'
          }`}>
            Laba Kotor
          </p>
          <div className="flex items-end gap-2 mb-6">
            <p className={`text-4xl font-bold leading-none ${
              labaPositif ? 'text-white' : 'text-error-600 dark:text-error-400'
            }`}>
              {fmt(Math.abs(rekap?.laba_kotor || 0))}
            </p>
            {labaPositif
              ? <TrendingUp size={20} className="text-success-400 mb-1" />
              : <TrendingDown size={20} className="text-error-500 mb-1" />
            }
          </div>
          <div className={`pt-4 border-t ${labaPositif ? 'border-gray-700' : 'border-error-200 dark:border-error-500/20'}`}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Jual', val: fmt(rekap?.total_penjualan || 0) },
                { label: 'Keluar', val: fmt(rekap?.total_pengeluaran || 0) },
                { label: 'Nota', val: `${rekap?.jumlah_transaksi || 0}x` },
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

        {/* Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
            Omset per Jam
          </p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#465fff" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#465fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="jam" tick={{ fontSize: 11, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: any) => [fmtFull(v as number), 'Omset']}
                  contentStyle={{
                    fontSize: 12, borderRadius: 10,
                    border: '1px solid #e4e7ec',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}
                />
                <Bar
                  dataKey="omset"
                  radius={[6, 6, 0, 0]}
                  fill="#465fff"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center text-gray-400">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-sm">Belum ada data hari ini</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Transaksi hari ini */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Transaksi Hari Ini
            </p>
            <span className="text-xs text-gray-400">
              {transaksi.length} nota
            </span>
          </div>

          {transaksi.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-4xl mb-3">🪲</span>
              <p className="text-sm text-gray-400">Belum ada transaksi hari ini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {transaksi.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    t.status_bayar === 'cash'
                      ? 'bg-success-50 dark:bg-success-500/10'
                      : 'bg-warning-50 dark:bg-warning-500/10'
                  }`}>
                    <Receipt size={15} className={
                      t.status_bayar === 'cash' ? 'text-success-500' : 'text-warning-500'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {t.transaksi_items?.map((i: any) =>
                        `${i.nama_item}${i.qty > 1 ? ` x${i.qty}` : ''}`
                      ).join(', ')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{t.nomor_nota}</span>
                      {t.nama_pelanggan && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400 font-medium">
                          {t.nama_pelanggan}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {fmt(t.total_nominal)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtTime(t.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Piutang aktif */}
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
                    {p.nama_pelanggan[0].toUpperCase()}
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
                    {fmt(p.sisa_hutang)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}