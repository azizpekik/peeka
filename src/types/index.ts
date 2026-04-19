export type JenisUsaha = 'warung' | 'frozen_food' | 'snack' | 'katering' | 'umum'
export type StatusBayar = 'cash' | 'piutang'
export type StatusPiutang = 'aktif' | 'lunas'
export type KategoriPengeluaran = 
  | 'bahan_baku' 
  | 'gas_listrik' 
  | 'gaji' 
  | 'sewa' 
  | 'lain_lain'

export interface User {
  id: string
  telegram_id: string
  nama_toko: string
  nama_pemilik: string | null
  jenis_usaha: JenisUsaha
  aktif: boolean
  created_at: string
}

export interface Transaksi {
  id: string
  user_id: string
  nomor_nota: string
  tanggal: string
  waktu: string
  total_nominal: number
  status_bayar: StatusBayar
  nama_pelanggan: string | null
  catatan: string | null
  created_at: string
  items?: TransaksiItem[]
}

export interface TransaksiItem {
  id: string
  transaksi_id: string
  nama_item: string
  harga: number
  qty: number
  subtotal: number
}

export interface Pengeluaran {
  id: string
  user_id: string
  tanggal: string
  waktu: string
  kategori: KategoriPengeluaran
  nominal: number
  catatan: string | null
  created_at: string
}

export interface Piutang {
  id: string
  transaksi_id: string
  user_id: string
  nama_pelanggan: string
  total_hutang: number
  total_terbayar: number
  sisa_hutang: number
  status: StatusPiutang
  created_at: string
  lunas_at: string | null
}

export interface PembayaranPiutang {
  id: string
  piutang_id: string
  nominal: number
  catatan: string | null
  created_at: string
}

export interface RekapHarian {
  total_penjualan: number
  total_cash: number
  total_piutang_baru: number
  total_pengeluaran: number
  laba_kotor: number
  jumlah_transaksi: number
}

// Untuk response API
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}