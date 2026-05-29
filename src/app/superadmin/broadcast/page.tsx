'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Send, 
  Users, 
  Save, 
  Trash2, 
  AlertCircle, 
  Check,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  History,
  Info
} from 'lucide-react'

interface User {
  id: string
  telegram_id: string
  nama_pemilik: string
  nama_toko: string
  aktif: boolean
}

interface Template {
  id: number
  name: string
  content: string
}

interface UserStats {
  totalWithTelegram: number
  activeWithTelegram: number
  returned: number
}

import { Suspense } from 'react'

function BroadcastPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'active' | 'specific'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showUserSelection, setShowUserSelection] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  
  // Status
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [broadcastId, setBroadcastId] = useState<number | null>(null)
  
  // Save template modal states
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Fetch users and templates on mount
  useEffect(() => {
    fetchUsers()
    fetchTemplates()
  }, [targetType])

  // Load template from query parameter
  useEffect(() => {
    const templateId = searchParams.get('template')
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === parseInt(templateId))
      if (template) {
        setMessage(template.content)
      }
    }
  }, [templates])

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(userSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  const fetchUsers = async (search = '') => {
    setLoadingUsers(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (targetType === 'active') params.append('status', 'active')
      
      const response = await fetch(`/superadmin/api/broadcast/users?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data)
        setUserStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await fetch('/superadmin/api/broadcast/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      setError('Pesan tidak boleh kosong')
      return
    }

    setSending(true)
    setError('')
    setSuccess('')

    try {
      const body: any = {
        message: message.trim(),
        targetType,
      }

      if (targetType === 'specific') {
        if (selectedUsers.length === 0) {
          setError('Pilih minimal satu user')
          setSending(false)
          return
        }
        body.userIds = selectedUsers
      }

      const response = await fetch('/superadmin/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setBroadcastId(data.data.broadcastId)
        setMessage('')
        setSelectedUsers([])
        
        // Redirect to history after 2 seconds
        setTimeout(() => {
          router.push('/superadmin/broadcast/history')
        }, 2000)
      } else {
        setError(data.error || 'Gagal mengirim broadcast')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setSending(false)
    }
  }

  const handleOpenSaveModal = () => {
    if (!message.trim()) {
      setError('Pesan tidak boleh kosong')
      return
    }
    setTemplateName('')
    setShowSaveModal(true)
  }

  const handleCloseSaveModal = () => {
    setShowSaveModal(false)
    setTemplateName('')
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Nama template tidak boleh kosong')
      return
    }

    setSavingTemplate(true)
    setError('')
    try {
      const response = await fetch('/superadmin/api/broadcast/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          content: message.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Template berhasil disimpan')
        fetchTemplates()
        handleCloseSaveModal()
      } else {
        setError(data.error || 'Gagal menyimpan template')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Yakin ingin menghapus template ini?')) return

    try {
      const response = await fetch(`/superadmin/api/broadcast/templates?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Template berhasil dihapus')
        fetchTemplates()
      }
    } catch (err) {
      console.error('Error deleting template:', err)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const getTargetCount = () => {
    if (!userStats) return 0
    if (targetType === 'all') return userStats.totalWithTelegram
    if (targetType === 'active') return userStats.activeWithTelegram
    return selectedUsers.length
  }

  const getPreviewMessage = () => {
    return message
      .replace(/{{nama}}/g, 'Budi')
      .replace(/{{toko}}/g, 'Toko Sejahtera')
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          Broadcast
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Kirim pesan ke semua users melalui Telegram
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users dengan Telegram</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {userStats?.totalWithTelegram || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Check size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Users Aktif</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {userStats?.activeWithTelegram || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Template Tersimpan</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {templates.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} className="text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <Check className="text-green-500" size={20} />
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Form */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tulis Pesan
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenSaveModal}
                  disabled={loading || !message.trim()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-500 transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  Simpan Template
                </button>
              </div>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pesan Anda di sini...\n\nGunakan {{nama}} untuk nama pemilik dan {{toko}} untuk nama toko"
              className="w-full h-48 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              maxLength={4096}
            />
            
            <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
              <span>{message.length} / 4096 karakter</span>
              <span className="text-xs">Support HTML format</span>
            </div>
          </div>

          {/* Target Selection */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pilih Target
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <input
                  type="radio"
                  value="all"
                  checked={targetType === 'all'}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Semua Users</p>
                  <p className="text-sm text-gray-500">Kirim ke semua users dengan Telegram ID ({userStats?.totalWithTelegram || 0} users)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <input
                  type="radio"
                  value="active"
                  checked={targetType === 'active'}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Users Aktif Saja</p>
                  <p className="text-sm text-gray-500">Hanya kirim ke users yang statusnya aktif ({userStats?.activeWithTelegram || 0} users)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <input
                  type="radio"
                  value="specific"
                  checked={targetType === 'specific'}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Pilih Users Tertentu</p>
                  <p className="text-sm text-gray-500">Pilih users spesifik ({selectedUsers.length} dipilih)</p>
                </div>
              </label>
            </div>

            {/* Specific User Selection */}
            {targetType === 'specific' && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pilih Users ({selectedUsers.length} dipilih)
                  </span>
                  <button
                    onClick={() => setShowUserSelection(!showUserSelection)}
                    className="text-sm text-brand-500 hover:underline"
                  >
                    {showUserSelection ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>

                {showUserSelection && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Cari user..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 size={20} className="animate-spin text-gray-400" />
                        </div>
                      ) : users.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Tidak ada users</p>
                      ) : (
                        users.map(user => (
                          <label
                            key={user.id}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {user.nama_pemilik}
                              </p>
                              <p className="text-xs text-gray-500">{user.nama_toko}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${user.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {user.aktif ? 'Aktif' : 'Non-aktif'}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendBroadcast}
            disabled={sending || !message.trim() || (targetType === 'specific' && selectedUsers.length === 0)}
            className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            {sending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Mengirim Broadcast...
              </>
            ) : (
              <>
                <Send size={20} />
                Kirim Broadcast ({getTargetCount()} users)
              </>
            )}
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Template Pesan
              </h3>
              {showTemplates ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showTemplates && (
              <div className="mt-4 space-y-3">
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : templates.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada template</p>
                ) : (
                  templates.map(template => (
                    <div
                      key={template.id}
                      className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {template.name}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {template.content.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setMessage(template.content)}
                            className="p-1.5 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded"
                            title="Gunakan template"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Hapus template"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Preview
            </h3>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {getPreviewMessage() || 'Preview akan muncul di sini...'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Info size={14} />
              <span>Variable {'{{nama}}'} dan {'{{toko}}'} akan diganti saat pengiriman</span>
            </div>
          </div>

          {/* Templates Link */}
          <a
            href="/superadmin/broadcast/templates"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FileText size={20} className="text-gray-500" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">Kelola Template</p>
              <p className="text-sm text-gray-500">Buat dan edit template pesan</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 -rotate-90" />
          </a>

          {/* History Link */}
          <a
            href="/superadmin/broadcast/history"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <History size={20} className="text-gray-500" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">Riwayat Broadcast</p>
              <p className="text-sm text-gray-500">Lihat status pengiriman sebelumnya</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 -rotate-90" />
          </a>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Simpan Template
              </h3>
              <button
                onClick={handleCloseSaveModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={16} />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Template
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Contoh: Promo Bulanan"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview Pesan
                </label>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="bg-white dark:bg-gray-700 rounded p-3 shadow-sm">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap line-clamp-5">
                      {message || 'Preview akan muncul di sini...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleCloseSaveModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingTemplate ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Simpan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// X component for close button
function X({ size, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// XIcon component for modal close button
function XIcon({ size }: { size?: number }) {
  return (
    <svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function BroadcastPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    }>
      <BroadcastPageContent />
    </Suspense>
  )
}
