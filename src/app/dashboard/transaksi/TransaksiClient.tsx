'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Receipt, ChevronDown, ChevronUp,
  Search, Pencil, Trash2, Plus, X, Check
} from 'lucide-react'

const WEBHOOK_SECRET = process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'peeka-secret-2026'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

interface Item {
  nama_item: string
  harga: number
  qty: number
  subtotal?: number
}

interface TransaksiClientProps {
  telegramId: string
}

export default function TransaksiClient({ telegramId }: TransaksiClientProps) {
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'semua' | 'cash' | 'piutang'>('semua')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Edit state
  const [editData, setEditData] = useState<any | null>(null)
  const [editItems, setEditItems] = useState<Item[]>([])
  const [editNamaPelanggan, setEditNamaPelanggan] = useState('')
  const [editStatusBayar, setEditStatusBayar] = useState<'cash' | 'piutang'>('cash')
  const [editCatatan, setEditCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transaksi?telegram_id=${telegramId}&tanggal=${tanggal}`)
      const json = await res.json()
      setTransaksi(json.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tanggal])

  const filtered = transaksi.filter(t => {
    const matchFilter = filter === 'semua' || t.status_bayar === filter
    const matchSearch = search === '' ||
      t.nomor_nota.toLowerCase().includes(search.toLowerCase()) ||
      t.transaksi_items?.some((i: any) => i.nama_item.toLowerCase().includes(search.toLowerCase())) ||
      (t.nama_pelanggan?.toLowerCase().includes(search.toLowerCase()))
    return matchFilter && matchSearch
  })

  const totalFiltered = filtered.reduce((s: number, t: any) => s + t.total_nominal, 0)

  // ── DELETE ──
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/transaksi?transaksi_id=${deleteId}`, {
        method: 'DELETE',
        headers: { 'x-webhook-secret': WEBHOOK_SECRET }
      })
      setDeleteId(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  // ── EDIT ──
  const openEdit = (t: any) => {
    setEditData(t)
    setEditItems(t.transaksi_items?.map((i: any) => ({
      nama_item: i.nama_item,
      harga: i.harga,
      qty: i.qty,
    })) || [])
    setEditNamaPelanggan(t.nama_pelanggan || '')
    setEditStatusBayar(t.status_bayar)
    setEditCatatan(t.catatan || '')
    setSaveSuccess(false)
  }

  const closeEdit = () => {
    setEditData(null)
    setEditItems([])
    setSaveSuccess(false)
  }

  const updateItem = (idx: number, field: keyof Item, value: string | number) => {
    setEditItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'nama_item' ? value : Number(value) } : item
    ))
  }

  const addItem = () => {
    setEditItems(prev => [...prev, { nama_item: '', harga: 0, qty: 1 }])
  }

  const removeItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx))
  }

  const editTotal = editItems.reduce((s, i) => s + i.harga * i.qty, 0)

  const handleSave = async () => {
    if (!editData || editItems.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/transaksi', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: JSON.stringify({
          transaksi_id: editData.id,
          items: editItems,
          status_bayar: editStatusBayar,
          nama_pelanggan: editNamaPelanggan || null,
          catatan: editCatatan || null
        })
      })
      const json = await res.json()
      if (json.data) {
        setSaveSuccess(true)
        setTimeout(() => {
          closeEdit()
          load()
        }, 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Transaksi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">History penjualan per hari</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="date"
          value={tanggal}
          onChange={e => setTanggal(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari item atau pelanggan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {(['semua', 'cash', 'piutang'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(tanggal)}</span>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{filtered.length} transaksi</span>
        </div>
        <span className="text-sm font-bold text-gray-800 dark:text-white/90">{fmtFull(totalFiltered)}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Image src="/logo/logo-peeka.png" alt="Loading" width={56} height={56} className="animate-bounce rounded-xl mb-3" />
          <p className="text-sm text-gray-400">Memuat transaksi...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm font-medium text-gray-500">Tidak ada transaksi</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {filtered.map((t: any, idx: number) => (
            <div key={t.id} className={idx < filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>

              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                <button
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    t.status_bayar === 'cash' ? 'bg-success-50 dark:bg-success-500/10' : 'bg-warning-50 dark:bg-warning-500/10'
                  }`}>
                    <Receipt size={15} className={t.status_bayar === 'cash' ? 'text-success-500' : 'text-warning-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {t.transaksi_items?.map((i: any) => `${i.nama_item}${i.qty > 1 ? ` x${i.qty}` : ''}`).join(', ')}
                    </p>
                    {t.nama_pelanggan && (
                      <p className="text-xs text-warning-500 truncate mt-0.5 font-medium">
                        👤 {t.nama_pelanggan}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{t.nomor_nota}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap ${
                        t.status_bayar === 'cash'
                          ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                          : 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400'
                      }`}>
                        {t.status_bayar}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block mr-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-white/90">{fmt(t.total_nominal)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtTime(t.created_at)}</p>
                  </div>
                  {expanded === t.id ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                </button>

                {/* Mobile: nominal + time shown below */}
                <div className="flex sm:hidden flex-col items-end gap-0.5 flex-shrink-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-white/90">{fmt(t.total_nominal)}</p>
                  <p className="text-[10px] text-gray-400">{fmtTime(t.created_at)}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded */}
              {expanded === t.id && (
                <div className="px-5 pb-4 bg-gray-50 dark:bg-white/[0.02]">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Qty</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Harga</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {t.transaksi_items?.map((item: any) => (
                          <tr key={item.id} className="bg-white dark:bg-gray-900">
                            <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{item.nama_item}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{item.qty}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">{fmtFull(item.harga)}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-700 dark:text-gray-300">{fmtFull(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02]">
                          <td colSpan={3} className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500">Total</td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-800 dark:text-white/90">{fmtFull(t.total_nominal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {t.catatan && <p className="text-xs text-gray-400 mt-2 px-1">📝 {t.catatan}</p>}
                  <div className="flex justify-end mt-3">
                    <a
                      href={`/api/nota?nomor_nota=${t.nomor_nota}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                    >
                      <Receipt size={12} />
                      Lihat Nota PDF
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL DELETE ── */}
      {deleteId && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-error-50 dark:bg-error-500/10 flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-error-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">Hapus Transaksi?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Transaksi dan semua itemnya akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl bg-error-500 text-white text-sm font-semibold hover:bg-error-600 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT ── */}
      {editData && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeEdit} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-white/90">Edit Transaksi</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editData.nomor_nota}</p>
              </div>
              <button onClick={closeEdit} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <X size={16} />
              </button>
            </div>

            {saveSuccess ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center mb-3">
                  <Check size={20} className="text-success-500" />
                </div>
                <p className="text-sm font-semibold text-success-600">Tersimpan!</p>
              </div>
            ) : (
              <>
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

                  {/* Status bayar */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Status Bayar
                    </label>
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-fit">
                      {(['cash', 'piutang'] as const).map(s => (
                        <button key={s} onClick={() => setEditStatusBayar(s)}
                          className={`px-5 py-2 text-sm font-semibold transition-all ${
                            editStatusBayar === s
                              ? 'bg-brand-500 text-white'
                              : 'bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nama pelanggan */}
                  {editStatusBayar === 'piutang' && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                        Nama Pelanggan <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editNamaPelanggan}
                        onChange={e => setEditNamaPelanggan(e.target.value)}
                        placeholder="Nama pelanggan..."
                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items</label>
                      <button onClick={addItem}
                        className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600">
                        <Plus size={12} /> Tambah Item
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.nama_item}
                              onChange={e => updateItem(idx, 'nama_item', e.target.value)}
                              placeholder="Nama item..."
                              className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 mb-1.5"
                            />
                            <div className="flex gap-1.5">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                                <input
                                  type="number"
                                  value={item.harga || ''}
                                  onChange={e => updateItem(idx, 'harga', e.target.value)}
                                  placeholder="Harga"
                                  className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                />
                              </div>
                              <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                                <button onClick={() => updateItem(idx, 'qty', Math.max(1, item.qty - 1))}
                                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 font-bold">
                                  -
                                </button>
                                <span className="text-sm font-semibold w-6 text-center text-gray-700 dark:text-gray-300">
                                  {item.qty}
                                </span>
                                <button onClick={() => updateItem(idx, 'qty', item.qty + 1)}
                                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 font-bold">
                                  +
                                </button>
                              </div>
                              <span className="text-xs text-gray-400 self-center min-w-[48px] text-right">
                                {fmt(item.harga * item.qty)}
                              </span>
                            </div>
                          </div>
                          {editItems.length > 1 && (
                            <button onClick={() => removeItem(idx)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 flex-shrink-0">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center mt-3 px-1">
                      <span className="text-xs text-gray-400">Total</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-white/90">{fmtFull(editTotal)}</span>
                    </div>
                  </div>

                  {/* Catatan */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Catatan
                    </label>
                    <input
                      type="text"
                      value={editCatatan}
                      onChange={e => setEditCatatan(e.target.value)}
                      placeholder="Catatan opsional..."
                      className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                  <button onClick={closeEdit}
                    className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || editItems.some(i => !i.nama_item || i.harga === 0)}
                    className="flex-1 h-11 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}