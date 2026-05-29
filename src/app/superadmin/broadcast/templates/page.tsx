'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MessageSquare,
  Search,
  AlertCircle,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Save,
  X
} from 'lucide-react'

interface Template {
  id: number
  name: string
  content: string
  created_at: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalContent, setModalContent] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Search
  const [search, setSearch] = useState('')
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredTemplates(templates)
    } else {
      const filtered = templates.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.content.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredTemplates(filtered)
    }
  }, [search, templates])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/superadmin/api/broadcast/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
        setFilteredTemplates(data.data)
      } else {
        setError(data.error || 'Gagal memuat template')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template)
      setModalName(template.name)
      setModalContent(template.content)
    } else {
      setEditingTemplate(null)
      setModalName('')
      setModalContent('')
    }
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTemplate(null)
    setModalName('')
    setModalContent('')
  }

  const handleSaveTemplate = async () => {
    if (!modalName.trim()) {
      setError('Nama template tidak boleh kosong')
      return
    }

    if (!modalContent.trim()) {
      setError('Konten template tidak boleh kosong')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingTemplate) {
        // Update existing template - delete old and create new
        const deleteResponse = await fetch(`/superadmin/api/broadcast/templates?id=${editingTemplate.id}`, {
          method: 'DELETE',
        })

        if (!deleteResponse.ok) {
          throw new Error('Gagal mengupdate template')
        }
      }

      // Create new template
      const response = await fetch('/superadmin/api/broadcast/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalName.trim(),
          content: modalContent.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingTemplate ? 'Template berhasil diupdate' : 'Template berhasil dibuat')
        fetchTemplates()
        setTimeout(() => {
          handleCloseModal()
        }, 1000)
      } else {
        setError(data.error || 'Gagal menyimpan template')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenDeleteModal = (template: Template) => {
    setDeletingTemplate(template)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletingTemplate(null)
  }

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return

    setDeleting(true)
    try {
      const response = await fetch(`/superadmin/api/broadcast/templates?id=${deletingTemplate.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Template berhasil dihapus')
        fetchTemplates()
        handleCloseDeleteModal()
      } else {
        setError(data.error || 'Gagal menghapus template')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghapus')
    } finally {
      setDeleting(false)
    }
  }

  const handleUseTemplate = (template: Template) => {
    router.push(`/superadmin/broadcast?template=${template.id}`)
  }

  const getPreviewContent = (content: string) => {
    return content
      .replace(/{{nama}}/g, 'Budi')
      .replace(/{{toko}}/g, 'Toko Sejahtera')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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
            Kelola Template
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Buat dan kelola template pesan broadcast
          </p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={18} />
          <span>Tambah Template</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <Check className="text-green-500" size={20} />
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Template</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{templates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari template..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {search ? 'Tidak ada template yang cocok' : 'Belum ada template'}
            </p>
            {!search && (
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 text-brand-500 hover:underline"
              >
                Buat template pertama
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(template)}
                      className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(template)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  {template.content}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {formatDate(template.created_at)}
                  </span>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    <MessageSquare size={14} />
                    Gunakan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTemplate ? 'Edit Template' : 'Tambah Template Baru'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
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
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Contoh: Promo Bulanan"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Isi Pesan
                </label>
                <textarea
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder="Tulis pesan template di sini...\n\nGunakan {{nama}} untuk nama pemilik dan {{toko}} untuk nama toko"
                  className="w-full h-48 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  maxLength={4096}
                />
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{modalContent.length} / 4096 karakter</span>
                  <span>Support HTML format</span>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="bg-white dark:bg-gray-700 rounded p-3 shadow-sm">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {getPreviewContent(modalContent) || 'Preview akan muncul di sini...'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Variable {'{{nama}}'} dan {'{{toko}}'} akan diganti saat pengiriman
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !modalName.trim() || !modalContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
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

      {/* Delete Modal */}
      {showDeleteModal && deletingTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Hapus Template
              </h3>
              <button
                onClick={handleCloseDeleteModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="text-red-500" size={20} />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">
                    Yakin ingin menghapus template ini?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">"{deletingTemplate.name}"</span> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preview:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {deletingTemplate.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Hapus
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

// X icon component
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
