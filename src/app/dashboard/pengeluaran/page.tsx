'use client'

import { useEffect, useState } from 'react'
import { TrendingDown, Search, Pencil, Trash2, X, Check } from 'lucide-react'

const TELEGRAM_ID = '387564171'
const SECRET = 'peeka-secret-2026'

const fmt = (n: number) => {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt'
  if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + 'rb'
  return 'Rp ' + n
}
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

const kategoriConfig: Record<string, { label: string; color: string; bg: string }> = {
  bahan_baku:  { label: 'Bahan Baku',    color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  gas_listrik: { label: 'Gas & Listrik', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
  gaji:        { label: 'Gaji',          color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-500/10' },
  sewa:        { label: 'Sewa',          color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  lain_lain:   { label: 'Lain-lain',     color: 'text-gray-600 dark:text-gray-400',    bg: 'bg-gray-100 dark:bg-gray-700' },
}

const kategoriOptions = Object.entries(kategoriConfig).map(([value, { label }]) => ({ value, label }))

export default function PengeluaranPage() {
  const [pengeluaran, setPengeluaran] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKat, setFilterKat] = useState<string>('semua')
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Edit
  const [editData, setEditData] = useState<any | null>(null)
  const [editKategori, setEditKategori] = useState('lain_lain')
  const [editNominal, setEditNominal] = useState('')
  const [editCatatan, setEditCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pengeluaran?telegram_id=${TELEGRAM_ID}&tanggal=${tanggal}`)
      const json = await res.json()
      setPengeluaran(json.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tanggal])

  const filtered = pengeluaran.filter(p => {
    const matchKat = filterKat === 'semua' || p.kategori === filterKat
    const matchSearch = search === '' ||
      p.catatan?.toLowerCase().includes(search.toLowerCase()) ||
      p.kategori.toLowerCase().includes(search.toLowerCase())
    return matchKat && matchSearch
  })

  const totalFiltered = filtered.reduce((s: number, p: any) => s + p.nominal, 0)

  const rekapKat = pengeluaran.reduce((acc: any, p: any) => {
    acc[p.kategori] = (acc[p.kategori] || 0) + p.nominal
    return acc
  }, {})

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/pengeluaran?pengeluaran_id=${deleteId}`, {
        method: 'DELETE',
        headers: { 'x-webhook-secret': SECRET }
      })
      setDeleteId(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  // Edit
  const openEdit = (p: any) => {
    setEditData(p)
    setEditKategori(p.kategori)
    setEditNominal(String(p.nominal))
    setEditCatatan(p.catatan || '')
    setSaveSuccess(false)
  }

  const closeEdit = () => {
    setEditData(null)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!editData || !editNominal) return
    setSaving(true)
    try {
      const res = await fetch('/api/pengeluaran', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SECRET
        },
        body: JSON.stringify({
          pengeluaran_id: editData.id,
          kategori: editKategori,
          nominal: parseInt(editNominal),
          catatan: editCatatan || null
        })
      })
      const json = await res.json()
      if (json.data) {
        setSaveSuccess(true)
        setTimeout(() => { closeEdit(); load() }, 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Pengeluaran</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Biaya operasional harian</p>
      </div>

      {/* Rekap per kategori */}
      {Object.keys(rekapKat).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(rekapKat).map(([kat, total]) => {
            const cfg = kategoriConfig[kat] || kategoriConfig.lain_lain
            return (
              <button key={kat}
                onClick={() => setFilterKat(filterKat === kat ? 'semua' : kat)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  filterKat === kat
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                } bg-white dark:bg-gray-900`}
              >
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 ${cfg.bg}`}>
                  <TrendingDown size={14} className={cfg.color} />
                </div>
                <p className="text-xs text-gray-400 truncate">{cfg.label}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white/90 mt-0.5">{fmt(total as number)}</p>
              </button>
            )
          })}
        </div>
      )}

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
            placeholder="Cari catatan atau kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(tanggal)}</span>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{filtered.length} item</span>
        </div>
        <span className="text-sm font-bold text-error-600 dark:text-error-400">-{fmtFull(totalFiltered)}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-4xl animate-bounce mb-3">🪲</span>
          <p className="text-sm text-gray-400">Memuat pengeluaran...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-4xl mb-3">💸</span>
          <p className="text-sm font-medium text-gray-500">Tidak ada pengeluaran</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {filtered.map((p: any, idx: number) => {
            const cfg = kategoriConfig[p.kategori] || kategoriConfig.lain_lain
            return (
              <div key={p.id}
                className={`flex items-center gap-3 px-5 py-4 ${
                  idx < filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <TrendingDown size={15} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {p.catatan && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{p.catatan}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 mr-1">
                  <p className="text-sm font-bold text-error-600 dark:text-error-400">-{fmt(p.nominal)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtTime(p.created_at)}</p>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DELETE */}
      {deleteId && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-error-50 dark:bg-error-500/10 flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-error-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">Hapus Pengeluaran?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Data pengeluaran akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
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

      {/* MODAL EDIT */}
      {editData && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeEdit} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-10">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-800 dark:text-white/90">Edit Pengeluaran</h3>
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
                <div className="px-6 py-4 space-y-4">

                  {/* Kategori */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Kategori
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {kategoriOptions.map(({ value, label }) => {
                        const cfg = kategoriConfig[value]
                        return (
                          <button key={value}
                            onClick={() => setEditKategori(value)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                              editKategori === value
                                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                              <TrendingDown size={12} className={cfg.color} />
                            </span>
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Nominal */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Nominal
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                      <input
                        type="number"
                        value={editNominal}
                        onChange={e => setEditNominal(e.target.value)}
                        placeholder="0"
                        className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                      />
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
                      className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                  <button onClick={closeEdit}
                    className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editNominal || parseInt(editNominal) <= 0}
                    className="flex-1 h-11 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
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