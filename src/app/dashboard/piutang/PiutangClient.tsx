'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Users, CheckCircle, Clock, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric'
})

interface PiutangClientProps {
  telegramId: string
}

export default function PiutangClient({ telegramId }: PiutangClientProps) {
  const [tab, setTab] = useState<'aktif' | 'lunas'>('aktif')
  const [piutang, setPiutang] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Modal bayar
  const [modalPiutang, setModalPiutang] = useState<any | null>(null)
  const [nominalBayar, setNominalBayar] = useState('')
  const [catatanBayar, setCatatanBayar] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/piutang?telegram_id=${telegramId}&status=${tab}`)
      const json = await res.json()
      setPiutang(json.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab])

  const totalAktif = piutang.reduce((s, p) => s + p.sisa_hutang, 0)

  const handleBayar = async () => {
    if (!modalPiutang || !nominalBayar) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/piutang', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.NEXT_PUBLIC_WEBHOOK_SECRET || ''
        },
        body: JSON.stringify({
          piutang_id: modalPiutang.id,
          nominal: parseInt(nominalBayar.replace(/\D/g, '')),
          catatan: catatanBayar || null
        })
      })
      const json = await res.json()
      setSuccessMsg(json.message || 'Berhasil!')
      setTimeout(() => {
        setModalPiutang(null)
        setNominalBayar('')
        setCatatanBayar('')
        setSuccessMsg('')
        load()
      }, 1500)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Piutang</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Hutang pelanggan ke warung</p>
      </div>

      {/* Summary card — hanya di tab aktif */}
      {tab === 'aktif' && piutang.length > 0 && (
        <div className="rounded-2xl bg-gray-900 dark:bg-gray-800 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Total Piutang Aktif
          </p>
          <p className="text-4xl font-bold text-white">{fmt(totalAktif)}</p>
          <p className="text-sm text-gray-400 mt-2">{piutang.length} pelanggan belum lunas</p>
        </div>
      )}

      {/* Tab */}
      <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden w-fit">
        {(['aktif', 'lunas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-brand-500 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400'
            }`}>
            {t === 'aktif'
              ? <Clock size={14} />
              : <CheckCircle size={14} />
            }
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Image src="/logo/logo-peeka.png" alt="Loading" width={56} height={56} className="animate-bounce rounded-xl mb-3" />
          <p className="text-sm text-gray-400">Memuat piutang...</p>
        </div>
      ) : piutang.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-4xl mb-3">{tab === 'aktif' ? '✅' : '📋'}</span>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {tab === 'aktif' ? 'Tidak ada piutang aktif' : 'Belum ada piutang lunas'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {piutang.map((p: any) => {
            const progress = p.total_hutang > 0
              ? Math.round((p.total_terbayar / p.total_hutang) * 100)
              : 0

            return (
              <div key={p.id}
                className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">

                {/* Header card */}
                <div className="flex items-start gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-warning-600 dark:text-warning-400">
                    {p.nama_pelanggan[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-800 dark:text-white/90">
                        {p.nama_pelanggan}
                      </p>
                      {tab === 'lunas' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400 uppercase">
                          Lunas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.transaksi?.nomor_nota} · {fmtDate(p.created_at)}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Terbayar</span>
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          {fmtFull(p.total_terbayar)} / {fmtFull(p.total_hutang)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progress === 100 ? 'bg-success-500' : 'bg-warning-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Sisa */}
                    {tab === 'aktif' && (
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-400">
                          Sisa: <span className="font-bold text-warning-600 dark:text-warning-400">
                            {fmtFull(p.sisa_hutang)}
                          </span>
                        </p>
                        <div className="flex items-center gap-2">
                          {p.pembayaran_piutang?.length > 0 && (
                            <button
                              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            >
                              Riwayat
                              {expanded === p.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                          <button
                            onClick={() => setModalPiutang(p)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                          >
                            <Plus size={12} />
                            Catat Bayar
                          </button>
                        </div>
                      </div>
                    )}

                    {tab === 'lunas' && p.lunas_at && (
                      <p className="text-xs text-success-500 mt-2">
                        ✅ Lunas pada {fmtDate(p.lunas_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Riwayat bayar */}
                {expanded === p.id && p.pembayaran_piutang?.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      Riwayat Pembayaran
                    </p>
                    <div className="space-y-2">
                      {p.pembayaran_piutang.map((bayar: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">
                              {fmtFull(bayar.nominal)}
                            </p>
                            {bayar.catatan && (
                              <p className="text-xs text-gray-400">{bayar.catatan}</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{fmtDate(bayar.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Catat Bayar */}
      {modalPiutang && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalPiutang(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl z-10">

            {/* Header modal */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-white/90">
                  Catat Pembayaran
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">{modalPiutang.nama_pelanggan}</p>
              </div>
              <button onClick={() => setModalPiutang(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <X size={16} />
              </button>
            </div>

            {/* Info sisa */}
            <div className="rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-100 dark:border-warning-500/20 p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total hutang</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {fmtFull(modalPiutang.total_hutang)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Sudah dibayar</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {fmtFull(modalPiutang.total_terbayar)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1 pt-1 border-t border-warning-200 dark:border-warning-500/20">
                <span className="font-semibold text-warning-700 dark:text-warning-400">Sisa hutang</span>
                <span className="font-bold text-warning-700 dark:text-warning-400">
                  {fmtFull(modalPiutang.sisa_hutang)}
                </span>
              </div>
            </div>

            {successMsg ? (
              <div className="flex flex-col items-center py-6">
                <span className="text-4xl mb-2">🎉</span>
                <p className="text-sm font-semibold text-success-600">{successMsg}</p>
              </div>
            ) : (
              <>
                {/* Input nominal */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                    Nominal Bayar
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 50000"
                    value={nominalBayar}
                    onChange={e => setNominalBayar(e.target.value)}
                    max={modalPiutang.sisa_hutang}
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                  {parseInt(nominalBayar) === modalPiutang.sisa_hutang && (
                    <p className="text-xs text-success-500 mt-1">✅ Akan lunas setelah bayar ini</p>
                  )}
                </div>

                {/* Input catatan */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                    Catatan (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: bayar setengah dulu"
                    value={catatanBayar}
                    onChange={e => setCatatanBayar(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalPiutang(null)}
                    className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBayar}
                    disabled={!nominalBayar || submitting}
                    className="flex-1 h-11 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
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