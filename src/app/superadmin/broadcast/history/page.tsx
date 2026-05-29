'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Send
} from 'lucide-react'

interface Broadcast {
  id: number
  message_text: string
  target_type: string
  target_count: number
  sent_count: number
  failed_count: number
  status: 'pending' | 'sending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  completed_at: string | null
  error_message: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function BroadcastHistoryPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBroadcasts()
  }, [pagination.page])

  const fetchBroadcasts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      const response = await fetch(`/superadmin/api/broadcast?${params}`)
      const data = await response.json()

      if (data.success) {
        setBroadcasts(data.data)
        setPagination(data.pagination)
      } else {
        setError(data.error || 'Gagal memuat data')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus riwayat broadcast ini?')) return

    try {
      const response = await fetch(`/superadmin/api/broadcast/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchBroadcasts()
      } else {
        alert(data.error || 'Gagal menghapus')
      }
    } catch (err) {
      alert('Terjadi kesalahan')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      sending: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      completed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      failed: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      cancelled: 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
    }

    const labels = {
      pending: 'Menunggu',
      sending: 'Mengirim',
      completed: 'Selesai',
      failed: 'Gagal',
      cancelled: 'Dibatalkan',
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status === 'sending' && <Loader2 size={12} className="animate-spin" />}
        {status === 'completed' && <CheckCircle size={12} />}
        {status === 'failed' && <XCircle size={12} />}
        {status === 'pending' && <Clock size={12} />}
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateMessage = (message: string, maxLength = 100) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/superadmin/broadcast"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Kembali ke Broadcast
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Riwayat Broadcast
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Lihat status dan detail pengiriman broadcast
          </p>
        </div>
        
        <button
          onClick={fetchBroadcasts}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            ×
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm text-gray-500">Total Broadcast</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm text-gray-500">Selesai</p>
          <p className="text-2xl font-bold text-green-600">
            {broadcasts.filter(b => b.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm text-gray-500">Sedang Mengirim</p>
          <p className="text-2xl font-bold text-blue-600">
            {broadcasts.filter(b => b.status === 'sending').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm text-gray-500">Gagal</p>
          <p className="text-2xl font-bold text-red-600">
            {broadcasts.filter(b => b.status === 'failed').length}
          </p>
        </div>
      </div>

      {/* Broadcast List */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Send size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada riwayat broadcast</p>
            <Link
              href="/superadmin/broadcast"
              className="mt-2 text-brand-500 hover:underline"
            >
              Buat broadcast baru
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Pesan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Target
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Waktu
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {broadcasts.map((broadcast) => (
                    <tr key={broadcast.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {truncateMessage(broadcast.message_text)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {broadcast.target_count} users
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 capitalize">
                          {broadcast.target_type === 'all' && 'Semua'}
                          {broadcast.target_type === 'active' && 'Aktif'}
                          {broadcast.target_type === 'specific' && 'Tertentu'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600">{broadcast.sent_count}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-red-600">{broadcast.failed_count}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{broadcast.target_count}</span>
                          </div>
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{
                                width: `${(broadcast.sent_count / broadcast.target_count) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(broadcast.status)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(broadcast.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/superadmin/broadcast/${broadcast.id}`}
                            className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(broadcast.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Menampilkan {broadcasts.length} dari {pagination.total} broadcast
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
