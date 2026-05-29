'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Store, 
  CreditCard, 
  ShoppingBag, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX,
  Receipt
} from 'lucide-react'

interface UserData {
  id: string
  telegram_id: string
  nama_toko: string
  nama_pemilik: string
  jenis_usaha: string | null
  aktif: boolean
  created_at: string
  stats: {
    totalTransaksi: number
    totalOmset: number
    totalCash: number
    totalPiutang: number
    sisaPiutang: number
    piutangAktif: number
  }
  recentTransaksi: {
    id: string
    nomor_nota: string
    tanggal: string
    total_nominal: number
    status_bayar: string
    nama_pelanggan: string | null
  }[]
}

export default function UserDetailPage() {
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    nama_pemilik: '',
    nama_toko: '',
    jenis_usaha: '',
    telegram_id: '',
    aktif: true,
  })

  useEffect(() => {
    if (userId) {
      fetchUserDetail()
    }
  }, [userId])

  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`/superadmin/api/users/${userId}`)
      const data = await response.json()

      if (data.success) {
        setUser(data.data)
        setFormData({
          nama_pemilik: data.data.nama_pemilik,
          nama_toko: data.data.nama_toko,
          jenis_usaha: data.data.jenis_usaha || '',
          telegram_id: data.data.telegram_id,
          aktif: data.data.aktif,
        })
      } else {
        setError(data.error || 'Gagal memuat data user')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/superadmin/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage('Data user berhasil diupdate')
        setUser({ ...user!, ...data.data })
      } else {
        setError(data.error || 'Gagal mengupdate data')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchUserDetail}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/superadmin/users" className="hover:text-brand-500 transition-colors">
          Users
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{user.nama_pemilik}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/superadmin/users"
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Detail User
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Kelola data dan statistik user
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
              user.aktif
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {user.aktif ? (
              <>
                <UserCheck size={16} />
                Aktif
              </>
            ) : (
              <>
                <UserX size={16} />
                Non-aktif
              </>
            )}
          </span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <p className="text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Informasi User
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Pemilik
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.nama_pemilik}
                      onChange={(e) => setFormData({ ...formData, nama_pemilik: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Toko
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.nama_toko}
                      onChange={(e) => setFormData({ ...formData, nama_toko: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telegram ID
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.telegram_id}
                      onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jenis Usaha
                  </label>
                  <input
                    type="text"
                    value={formData.jenis_usaha}
                    onChange={(e) => setFormData({ ...formData, jenis_usaha: e.target.value })}
                    placeholder="Contoh: Warung Makan, Frozen Food"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Status Akun</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nonaktifkan untuk memblokir akses user
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, aktif: !formData.aktif })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.aktif ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.aktif ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Transaksi Terbaru
            </h2>
            {user.recentTransaksi.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Belum ada transaksi
              </p>
            ) : (
              <div className="space-y-3">
                {user.recentTransaksi.map((transaksi) => (
                  <div
                    key={transaksi.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaksi.status_bayar === 'cash' 
                          ? 'bg-green-50 dark:bg-green-900/20' 
                          : 'bg-orange-50 dark:bg-orange-900/20'
                      }`}>
                        <Receipt size={18} className={
                          transaksi.status_bayar === 'cash' ? 'text-green-500' : 'text-orange-500'
                        } />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaksi.nomor_nota}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaksi.nama_pelanggan || 'Tanpa nama'} • {formatDate(transaksi.tanggal)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatRupiah(transaksi.total_nominal)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        transaksi.status_bayar === 'cash'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                      }`}>
                        {transaksi.status_bayar === 'cash' ? 'Cash' : 'Piutang'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistik
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingBag size={18} className="text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Transaksi</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.stats.totalTransaksi}
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp size={18} className="text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Omset</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatRupiah(user.stats.totalOmset)}
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard size={18} className="text-purple-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Cash</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatRupiah(user.stats.totalCash)}
                </p>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle size={18} className="text-orange-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Piutang Aktif</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.stats.piutangAktif}
                </p>
                {user.stats.sisaPiutang > 0 && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    Sisa: {formatRupiah(user.stats.sisaPiutang)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Join Date */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informasi Lain
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Bergabung</span>
                <span className="text-gray-900 dark:text-white">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">User ID</span>
                <span className="text-gray-900 dark:text-white font-mono text-sm">{user.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}