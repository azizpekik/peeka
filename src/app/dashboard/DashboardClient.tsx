'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, Receipt, AlertTriangle } from 'lucide-react'

const TODAY = new Date().toISOString().split('T')[0]

// Helper formatting
const fmt = (n: number) => {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt'
  if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + 'rb'
  return 'Rp ' + n
}
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

interface DashboardClientProps {
  initialData: any;
  initialPiutang: any[];
  telegramId: string;
}

// Tambahkan ini di DashboardClient.tsx
const handleLogout = async () => {
  // Hapus cookie dengan cara mengesetnya ke masa lalu
  document.cookie = "peeka_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = '/auth/login';
};

// Pasang tombolnya di dalam Header (sebelah tombol refresh)
<button 
  onClick={handleLogout}
  className="p-2.5 rounded-xl bg-red-50 text-red-500 active:scale-95 transition-all"
>
  Logout
</button>

export default function DashboardClient({ initialData, initialPiutang, telegramId }: DashboardClientProps) {
  // Langsung pakai data dari Server (SSR) biar gak ada loading putih
  const [data, setData] = useState<any>(initialData)
  const [piutang, setPiutang] = useState<any[]>(initialPiutang)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fungsi load data yang sekarang sudah dinamis pake telegramId dari props
  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const [l, p] = await Promise.all([
        fetch(`/api/laporan?telegram_id=${telegramId}&tanggal=${TODAY}`).then(r => r.json()),
        fetch(`/api/piutang?telegram_id=${telegramId}&status=aktif`).then(r => r.json())
      ])
      if (l.success) setData(l.data)
      if (p.success) setPiutang(p.data)
    } catch (e) {
      console.error("Gagal load data:", e)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  // Auto-refresh tiap 30 detik
  useEffect(() => {
    const timer = setInterval(() => load(true), 30000)
    return () => clearInterval(timer)
  }, [telegramId])

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Peeka 🐝
            </h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Business Assistant</p>
          </div>
          <button 
            onClick={() => load(true)}
            disabled={refreshing}
            className={`p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 transition-all active:scale-95 ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-5 space-y-6">
        {/* RINGKASAN UTAMA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-3">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <p className="text-xs text-gray-400 font-medium">Pemasukan</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">{fmtFull(data?.total_pemasukan)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-3">
              <TrendingDown className="text-red-600" size={20} />
            </div>
            <p className="text-xs text-gray-400 font-medium">Pengeluaran</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">{fmtFull(data?.total_pengeluaran)}</p>
          </div>
        </div>

        {/* METODE PEMBAYARAN */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Receipt size={18} className="text-blue-500" />
              Metode Bayar
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-500">Tunai (Cash)</span>
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{fmtFull(data?.total_cash)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span className="text-sm text-gray-500">Piutang (Bon)</span>
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{fmtFull(data?.total_piutang)}</span>
            </div>
          </div>
        </div>

        {/* CHART DATA */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Tren Transaksi</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chart_data || []}>
                <XAxis dataKey="jam" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} dy={10} />
                <Tooltip 
                    cursor={{fill: '#f3f4f6', radius: 8}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    // Gunakan Number(value) untuk memastikan tipenya aman
                    formatter={(value) => [fmtFull(Number(value)), 'Pemasukan']}
                    />
                <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={24}>
                { (data?.chart_data || []).map((entry: any, index: number) => (
                    <Cell 
                    key={`cell-${index}`} 
                    fill={index === (data?.chart_data?.length - 1) ? '#4f46e5' : '#e0e7ff'} 
                    />
                ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIUTANG AKTIF */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-orange-50/30 dark:bg-orange-500/5">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              Piutang Belum Lunas
            </h2>
            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {(piutang || []).length} ORANG
            </span>
          </div>

          {(!piutang || piutang.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10">
              <span className="text-3xl mb-2">✅</span>
              <p className="text-sm text-gray-400">Tidak ada piutang</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {piutang.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-600 dark:text-orange-400">
                    {p.nama_pelanggan ? p.nama_pelanggan[0].toUpperCase() : 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {p.nama_pelanggan}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-orange-600">{fmt(p.total_nominal)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}