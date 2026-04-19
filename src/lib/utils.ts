// Utility function to combine class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Format angka ke Rupiah
export const formatRupiah = (nominal: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(nominal)
}

// Format tanggal Indonesia
export const formatTanggal = (tanggal: string): string => {
  return new Date(tanggal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Generate nomor nota (backup kalau DB function tidak dipanggil)
export const generateNomorNota = (urutan: number): string => {
  const tanggal = new Date().toISOString().split('T')[0].replace(/-/g, '')
  return `PEEKA-${tanggal}-${String(urutan).padStart(3, '0')}`
}

// Validasi telegram_id dari n8n
export const validateWebhookSecret = (secret: string): boolean => {
  return secret === process.env.N8N_WEBHOOK_SECRET
}