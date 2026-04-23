'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface User {
  id: string
  nama_toko: string
  nama_pemilik: string
  jenis_usaha: string
  telegram_id: string
  no_wa: string
  alamat_toko: string
  keterangan_pembayaran: string
  catatan_nota: string
  logo_url: string
}

export default function ProfileForm({ user, userId }: { user: User; userId: string }) {
  const [namaToko, setNamaToko] = useState(user?.nama_toko || '')
  const [namaPemilik, setNamaPemilik] = useState(user?.nama_pemilik || '')
  const [jenisUsaha, setJenisUsaha] = useState(user?.jenis_usaha || '')
  const [noWa, setNoWa] = useState(user?.no_wa || '')
  const [alamatToko, setAlamatToko] = useState(user?.alamat_toko || '')
  const [keteranganBayar, setKeteranganBayar] = useState(user?.keterangan_pembayaran || '')
  const [catatanNota, setCatatanNota] = useState(user?.catatan_nota || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          nama_toko: namaToko,
          nama_pemilik: namaPemilik,
          jenis_usaha: jenisUsaha,
          no_wa: noWa,
          alamat_toko: alamatToko,
          keterangan_pembayaran: keteranganBayar,
          catatan_nota: catatanNota
        })
      })
      const json = await res.json()

      if (json.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      } else {
        alert(json.error || 'Gagal menyimpan')
      }
    } catch (err) {
      alert('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen pb-20">
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-5">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Pengaturan Profil</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola informasi toko</p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="space-y-6">

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Toko</label>
                <input type="text" value={namaToko} onChange={(e) => setNamaToko(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Pemilik</label>
                <input type="text" value={namaPemilik} onChange={(e) => setNamaPemilik(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">No. WhatsApp</label>
                <input type="text" value={noWa} onChange={(e) => setNoWa(e.target.value)} placeholder="08xxxxxxxxxx" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Jenis Usaha</label>
                <select value={jenisUsaha} onChange={(e) => setJenisUsaha(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500" required>
                  <option value="">Pilih Jenis Usaha</option>
                  <option value="Warung Sembako / Toko Kelontong">Warung Sembako / Toko Kelontong</option>
                  <option value="Kedai Kopi / Warkop / Cafe">Kedai Kopi / Warkop / Cafe</option>
                  <option value="Rumah Makan / Warteg / Kuliner">Rumah Makan / Warteg / Kuliner</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Fashion & Aksesoris">Fashion & Aksesoris</option>
                  <option value="Barbershop / Salon">Barbershop / Salon</option>
                  <option value="Bengkel / Cuci Kendaraan">Bengkel / Cuci Kendaraan</option>
                  <option value="Toko Bangunan">Toko Bangunan</option>
                  <option value="Konter Pulsa & Gadget">Konter Pulsa & Gadget</option>
                  <option value="Petshop">Petshop</option>
                  <option value="Toko Alat Tulis (ATK)">Toko Alat Tulis (ATK)</option>
                  <option value="Jasa Fotocopy / Print">Jasa Fotocopy / Print</option>
                  <option value="Online Shop (Umum)">Online Shop (Umum)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Alamat Toko</label>
                <textarea value={alamatToko} onChange={(e) => setAlamatToko(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Customize Nota</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Keterangan Pembayaran</label>
                    <textarea value={keteranganBayar} onChange={(e) => setKeteranganBayar(e.target.value)} placeholder="Contoh: Bayar ke rekening BCA 123456789 a.n. Nama" rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Catatan Nota (Footer)</label>
                    <textarea value={catatanNota} onChange={(e) => setCatatanNota(e.target.value)} placeholder="Contoh: Terima kasih atas kunjungan Anda" rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 pt-4">
                <button type="submit" disabled={loading} className="w-full md:w-auto md:px-12 py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {loading ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>) : success ? (<><Check size={16} />Tersimpan!</>) : 'Simpan Perubahan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </main>
  )
}