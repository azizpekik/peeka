'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Users, UserCheck, UserX, TrendingUp, DollarSign, ShoppingCart, AlertCircle, Download, RefreshCw, Calendar, PieChart, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import Link from 'next/link'
import html2canvas from 'html2canvas'

interface Stats {
  users: {
    total: number
    active: number
    inactive: number
    newToday: number
  }
  transactions: {
    total: number
    today: number
  }
  revenue: {
    total: number
    today: number
  }
  piutang: {
    active: number
  }
  charts: {
    userGrowth: { date: string; count: number }[]
    revenue: { date: string; amount: number }[]
    userDistribution: { name: string; value: number; color: string }[]
    weeklyTransactions: { week: string; count: number; revenue: number }[]
  }
  meta: {
    range: number
    startDate: string
    endDate: string
  }
}

type TimeRange = '7' | '30' | '90' | '365'

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
}

const formatDateLong = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

const timeRangeOptions = [
  { value: '7', label: '7 Hari' },
  { value: '30', label: '30 Hari' },
  { value: '90', label: '3 Bulan' },
  { value: '365', label: '1 Tahun' },
]

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>('7')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  
  const userGrowthRef = useRef<HTMLDivElement>(null)
  const revenueRef = useRef<HTMLDivElement>(null)
  const distributionRef = useRef<HTMLDivElement>(null)
  const weeklyRef = useRef<HTMLDivElement>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/superadmin/api/stats?range=${timeRange}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
        setLastUpdated(new Date())
        setError('')
      } else {
        setError(data.error || 'Gagal memuat data')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  // Initial fetch
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchStats()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchStats, autoRefresh])

  const handleExportChart = async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview statistik Peeka Dashboard
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
            <Calendar size={16} className="text-gray-400 ml-2" />
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as TimeRange)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  timeRange === option.value
                    ? 'bg-brand-500 text-white'
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
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              autoRefresh
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            title="Auto-refresh setiap 5 menit"
          >
            <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
            <span className="text-sm hidden sm:inline">{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Last Updated Info */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>Periode: {formatDateLong(stats.meta.startDate)} - {formatDateLong(stats.meta.endDate)}</span>
        <span className="mx-2">•</span>
        <span>Terakhir update: {lastUpdated.toLocaleTimeString('id-ID')}</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.users.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 font-medium">+{stats.users.newToday}</span>
            <span className="text-gray-400 ml-2">hari ini</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Users Aktif</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.users.active}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <UserCheck size={24} className="text-green-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-400">{stats.users.inactive} non-aktif</span>
          </div>
        </div>

        {/* Revenue Today */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Omset Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatRupiah(stats.revenue.today)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-purple-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-400">Total: {formatRupiah(stats.revenue.total)}</span>
          </div>
        </div>

        {/* Transactions Today */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transaksi Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.transactions.today}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <ShoppingCart size={24} className="text-orange-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-400">Total: {stats.transactions.total}</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div ref={userGrowthRef} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pertumbuhan Users
              </h3>
            </div>
            <button
              onClick={() => handleExportChart(userGrowthRef, 'pertumbuhan-users')}
              disabled={exporting === 'pertumbuhan-users'}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {exporting === 'pertumbuhan-users' ? '...' : 'Export'}
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => formatDate(value as string)}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#465fff" 
                  strokeWidth={2}
                  dot={{ fill: '#465fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div ref={revenueRef} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-brand-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Omset
              </h3>
            </div>
            <button
              onClick={() => handleExportChart(revenueRef, 'omset')}
              disabled={exporting === 'omset'}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {exporting === 'omset' ? '...' : 'Export'}
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.charts.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value: number) => [formatRupiah(value), 'Omset']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#465fff" 
                  fill="#465fff"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution Pie Chart */}
        <div ref={distributionRef} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart size={20} className="text-brand-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Distribusi Users
              </h3>
            </div>
            <button
              onClick={() => handleExportChart(distributionRef, 'distribusi-users')}
              disabled={exporting === 'distribusi-users'}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {exporting === 'distribusi-users' ? '...' : 'Export'}
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={stats.charts.userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.charts.userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [`${value} users`, name]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value: string, entry: any) => (
                    <span style={{ color: entry.color }}>{value}: {entry.payload.value}</span>
                  )}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Transactions Bar Chart */}
        <div ref={weeklyRef} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-brand-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transaksi per Minggu
              </h3>
            </div>
            <button
              onClick={() => handleExportChart(weeklyRef, 'transaksi-mingguan')}
              disabled={exporting === 'transaksi-mingguan'}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {exporting === 'transaksi-mingguan' ? '...' : 'Export'}
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.weeklyTransactions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="week" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Omset') return [formatRupiah(value), name]
                    return [`${value} transaksi`, name]
                  }}
                />
                <Legend />
                <Bar dataKey="count" name="Jumlah Transaksi" fill="#465fff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Omset" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Aksi Cepat
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/superadmin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Users size={18} />
            <span>Kelola Users</span>
          </Link>
          <Link
            href="/superadmin/broadcast"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <TrendingUp size={18} />
            <span>Kirim Broadcast</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
