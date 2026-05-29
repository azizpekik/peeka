'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface Broadcast {
  id: number
  message_text: string
  target_type: string
  target_count: number
  sent_count: number
  failed_count: number
  status: string
  created_at: string
  completed_at: string | null
  error_message: string | null
}

interface Recipient {
  id: number
  user_id: string
  telegram_id: string
  status: string
  error_message: string | null
  sent_at: string | null
  user: {
    nama_pemilik: string
    nama_toko: string
  }
}

export default function BroadcastDetailPage() {
  const params = useParams()
  const broadcastId = params.id as string
  
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (broadcastId) {
      fetchBroadcastDetail()
    }
  }, [broadcastId])

  const fetchBroadcastDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/superadmin/api/broadcast/${broadcastId}`)
      const data = await response.json()

      if (data.success) {
        setBroadcast(data.data.broadcast)
        setRecipients(data.data.recipients)
      } else {
        setError(data.error || 'Gagal memuat data')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      sent: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      failed: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      delivered: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    }

    const labels = {
      pending: 'Menunggu',
      sent: 'Terkirim',
      failed: 'Gagal',
      delivered: 'Terkirim',
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status === 'sent' && <CheckCircle size={12} />}
        {status === 'failed' && <XCircle size={12} />}
        {status === 'pending' && <Clock size={12} />}
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    )
  }

  if (error || !broadcast) {
    return (
      <div className="space-y-6">
        <Link
          href="/superadmin/broadcast/history"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Riwayat
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-red-600 dark:text-red-400">{error || 'Broadcast tidak ditemukan'}</p>
        </div>
      </div>
    )
  }

  const successRate = broadcast.target_count > 0 
    ? Math.round((broadcast.sent_count / broadcast.target_count) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/superadmin/broadcast/history"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Kembali ke Riwayat
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Detail Broadcast #{broadcast.id}
          </h1>
        </div>
        
        <button
          onClick={fetchBroadcastDetail}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500">Target</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{broadcast.target_count}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 text-green-600">Berhasil</p>
          <p className="text-2xl font-bold text-green-600">{broadcast.sent_count}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 text-red-600">Gagal</p>
          <p className="text-2xl font-bold text-red-600">{broadcast.failed_count}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold text-brand-500">{successRate}%</p>
        </div>
      </div>

      {/* Message Card */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare size={20} />
          Pesan yang Dikirim
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {broadcast.message_text}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Target Type:</span>
            <span className="ml-2 capitalize font-medium">{broadcast.target_type}</span>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <span className="ml-2">{getStatusBadge(broadcast.status)}</span>
          </div>
          <div>
            <span className="text-gray-500">Dibuat:</span>
            <span className="ml-2">{formatDate(broadcast.created_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">Selesai:</span>
            <span className="ml-2">{formatDate(broadcast.completed_at)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Progress Pengiriman
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {broadcast.sent_count + broadcast.failed_count} / {broadcast.target_count} terkirim
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.round(((broadcast.sent_count + broadcast.failed_count) / broadcast.target_count) * 100)}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div
                className="h-full bg-green-500"
                style={{ width: `${(broadcast.sent_count / broadcast.target_count) * 100}%` }}
              />
              <div
                className="h-full bg-red-500"
                style={{ width: `${(broadcast.failed_count / broadcast.target_count) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-gray-600">Berhasil ({broadcast.sent_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-gray-600">Gagal ({broadcast.failed_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
              <span className="text-gray-600">Pending ({broadcast.target_count - broadcast.sent_count - broadcast.failed_count})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recipients List */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detail Penerima ({recipients.length})
          </h3>
        </div>
        
        {recipients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada data penerima
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telegram ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Waktu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {recipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {recipient.user?.nama_pemilik || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {recipient.user?.nama_toko || 'Unknown'}
                      </p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {recipient.telegram_id}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {getStatusBadge(recipient.status)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-500">
                        {formatDate(recipient.sent_at)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {recipient.error_message && (
                        <span className="text-xs text-red-600" title={recipient.error_message}>
                          {recipient.error_message.length > 30 
                            ? recipient.error_message.substring(0, 30) + '...' 
                            : recipient.error_message}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
