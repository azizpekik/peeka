'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, Receipt, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const TODAY = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]

// Helper formatting
const fmt = (n: number) => {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt'
  if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + 'rb'
  return 'Rp ' + n
}
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

interface DashboardClientProps {
  initialData: any;
  initialPiutang: any[];
  telegramId: string;
}

export default function DashboardClient({ initialData, initialPiutang, telegramId }: DashboardClientProps) {
  const [data, setData] = useState<any>(initialData)
  const [piutang, setPiutang] = useState<any[]>(initialPiutang)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (refresh = false) => {
    setRefreshing(true)
    try {
      const [l, p] = await Promise.all([
        fetch(`/api/laporan?telegram_id=${telegramId}&tanggal=${TODAY}`).then(r => r.json()),
        fetch(`/api/piutang?telegram_id=${telegramId}&status=aktif`).then(r => r.json())
      ])
      if (l.success) setData(l.data)
      if (p.success) setPiutang(p.data)
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => load(true), 30000)
    return () => clearInterval(timer)
  }, [telegramId])

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Peeka 🐝</h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">ID: {telegramId}</p>
          </div>
          <button onClick={() => load(true)} className={`p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 transition-all ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-5 flex flex-col gap-6">
        {/* RINGKASAN */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <TrendingUp className="text-green-600 mb-2" size={20} />
            <p className="text-xs text-gray-400 font-medium">Pemasukan</p>
            <p className="text-lg font-bold dark:text-gray-100">{fmtFull(data?.total_pemasukan)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <TrendingDown className="text-red-600 mb-2" size={20} />
            <p className="text-xs text-gray-400 font-medium">Pengeluaran</p>
            <p className="text-lg font-bold dark:text-gray-100">{fmtFull(data?.total_pengeluaran)}</p>
          </div>
        </div>

        {/* CHART */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Tren Transaksi</h2>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chart_data || []}>
                <XAxis dataKey="jam" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip formatter={(value) => [fmtFull(Number(value)), 'Total']} />
                <Bar dataKey="total" radius={[4, 4, 4, 4]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIUTANG AKTIF */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-orange-50/20">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" /> Piutang
            </h2>
            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{piutang.length} ORANG</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {piutang.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-bold text-orange-600">
                  {p.nama_pelanggan ? p.nama_pelanggan[0].toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-gray-300 truncate">{p.nama_pelanggan}</p>
                </div>
                {/* Perbaikan harga piutang: ganti ke total_hutang */}
                <p className="text-sm font-semibold text-orange-600">{fmt(p.total_hutang || p.total_nominal || 0)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* DETAIL TRANSAKSI HARI INI (BARU) */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 dark:text-gray-100">Detail Transaksi</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(data?.transaksi_list || []).map((t: any, i: number) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    t.status_bayar === 'pengeluaran' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {t.status_bayar === 'pengeluaran' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-gray-200">{t.nomor_nota || 'Transaksi'}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">{fmtTime(t.created_at)} • {t.status_bayar}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${t.status_bayar === 'pengeluaran' ? 'text-red-600' : 'text-green-600'}`}>
                  {t.status_bayar === 'pengeluaran' ? '-' : '+'}{fmt(t.total_nominal)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}