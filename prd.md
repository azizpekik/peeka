# PEEKA Dashboard — PRD & Copilot Agent Prompt

---

## CONTEXT UNTUK COPILOT

Kamu adalah expert Next.js 14+ developer dengan keahlian UI/UX. Tugasmu adalah membangun dashboard web untuk produk bernama **Peeka** — aplikasi pencatatan keuangan UMKM via Telegram bot.

Baca seluruh dokumen ini sebelum menulis satu baris kode pun.

---

## 1. PRODUCT OVERVIEW

**Peeka** adalah sistem kasir mini + pencatatan keuangan untuk UMKM (warung makan, frozen food, snack, katering kecil) di Indonesia, khususnya kota tier 2-3. Owner mencatat transaksi via Telegram bot, dan dashboard ini adalah tempat mereka **melihat laporan, piutang, dan history transaksi**.

### Target User
- Pemilik warung makan, frozen food, snack
- Usia 25-50 tahun
- Familiar dengan smartphone tapi bukan tech-savvy
- Mayoritas akses via HP, bukan desktop

### Brand Identity
- Nama: **Peeka**
- Maskot: kunang-kunang chibi (🪲)
- Tagline: *"Intip bisnismu, tiap malam."*
- Warna brand: Sky Blue `#60B4F7`, Lemon Yellow `#FFE566`, Pink `#FF8FAB`

---

## 2. TECH STACK

```
Framework   : Next.js 14+ (App Router, TypeScript)
Styling     : Tailwind CSS
Charts      : Recharts
Icons       : Lucide React
Database    : Supabase (PostgreSQL)
Font        : Google Fonts — Syne (display) + DM Sans (body)
```

### Existing Dependencies
```json
{
  "recharts": "latest",
  "lucide-react": "latest",
  "@supabase/supabase-js": "latest"
}
```

### Environment Variables (sudah ada di .env.local)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
N8N_WEBHOOK_SECRET
```

---

## 3. EXISTING FILES (JANGAN DIUBAH)

```
src/
├── lib/
│   ├── supabase.ts      ← Supabase client (supabase + supabaseAdmin)
│   └── utils.ts         ← formatRupiah, formatTanggal, validateWebhookSecret
├── types/
│   └── index.ts         ← Semua TypeScript interfaces
└── app/
    ├── api/
    │   ├── transaksi/route.ts    ← GET & POST
    │   ├── pengeluaran/route.ts  ← GET & POST
    │   ├── piutang/route.ts      ← GET & POST (bayar cicil/lunas)
    │   └── laporan/route.ts      ← GET (rekap harian + telegram_text)
    └── globals.css
```

### API Contracts

**GET /api/laporan?telegram_id=xxx&tanggal=YYYY-MM-DD**
```typescript
{
  data: {
    toko: { nama_toko: string, nama_pemilik: string },
    tanggal: string,
    rekap: {
      total_penjualan: number,
      total_cash: number,
      total_piutang_baru: number,
      total_pengeluaran: number,
      laba_kotor: number,
      jumlah_transaksi: number
    },
    transaksi: Transaksi[],    // include transaksi_items
    pengeluaran: Pengeluaran[],
    piutang_aktif: Piutang[],
    telegram_text: string
  }
}
```

**GET /api/transaksi?telegram_id=xxx&tanggal=YYYY-MM-DD**
```typescript
{ data: Transaksi[] }  // transaksi_items included via join
```

**GET /api/pengeluaran?telegram_id=xxx&tanggal=YYYY-MM-DD**
```typescript
{ data: Pengeluaran[] }
```

**GET /api/piutang?telegram_id=xxx&status=aktif|lunas**
```typescript
{
  data: {
    id: string,
    nama_pelanggan: string,
    total_hutang: number,
    total_terbayar: number,
    sisa_hutang: number,
    status: 'aktif' | 'lunas',
    created_at: string,
    lunas_at: string | null,
    transaksi: { nomor_nota: string, tanggal: string },
    pembayaran_piutang: PembayaranPiutang[]
  }[]
}
```

**POST /api/piutang** — bayar piutang
```typescript
// Request body
{ piutang_id: string, nominal: number, catatan?: string }
// Response
{ data: { pembayaran, piutang }, message: string }
```

---

## 4. DATABASE SCHEMA (Supabase)

```sql
users (id, telegram_id, nama_toko, nama_pemilik, jenis_usaha, aktif, created_at)
transaksi (id, user_id, nomor_nota, tanggal, waktu, total_nominal, status_bayar, nama_pelanggan, catatan, created_at)
transaksi_items (id, transaksi_id, nama_item, harga, qty, subtotal, created_at)
pengeluaran (id, user_id, tanggal, waktu, kategori, nominal, catatan, created_at)
piutang (id, transaksi_id, user_id, nama_pelanggan, total_hutang, total_terbayar, sisa_hutang, status, created_at, lunas_at)
pembayaran_piutang (id, piutang_id, nominal, catatan, created_at)
```

---

## 5. DESIGN SYSTEM

### Philosophy
Adopsi DNA design dari **4pto.io**: clean, high-contrast, typography-driven, border-based (bukan shadow-based). Tapi tetap **light mode** karena target user UMKM lebih familiar dengan UI terang seperti aplikasi perbankan Indonesia (BCA Mobile, Dana, GoPay).

### Design Principles
1. **Typography first** — angka besar, label kecil uppercase, font berkarakter
2. **Border over shadow** — cards pakai border tipis, bukan box-shadow
3. **High contrast** — teks gelap di background terang, aksen warna hanya di tempat penting
4. **Mobile first** — semua layout dirancang untuk layar 375px dulu
5. **Data density** — owner warung butuh info padat, bukan whitespace berlebihan

### Color Tokens
```css
--bg-base: #F8F7F4;          /* Background utama — warm off-white */
--bg-surface: #FFFFFF;        /* Card/surface */
--bg-sunken: #F2F1EE;         /* Input, tag background */
--border: #E8E5DF;            /* Border default */
--border-strong: #C8C5BF;     /* Border hover/focus */

--ink: #141210;               /* Text utama */
--ink-secondary: #6B6560;     /* Text secondary */
--ink-muted: #A8A39D;         /* Text muted/placeholder */

--accent-blue: #60B4F7;       /* Sky blue — brand Peeka */
--accent-blue-soft: #EDF6FF;  /* Blue background lembut */
--accent-yellow: #F0BC00;     /* Lemon yellow — brand Peeka */
--accent-yellow-soft: #FFFBEB;/* Yellow background lembut */
--accent-pink: #FF8FAB;       /* Pink — brand Peeka */

--success: #16A34A;           /* Untung/positif */
--success-soft: #F0FDF4;
--danger: #DC2626;            /* Rugi/negatif */
--danger-soft: #FEF2F2;
--warning: #D97706;           /* Piutang/pending */
--warning-soft: #FFFBEB;
```

### Typography
```css
/* Import di globals.css */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

/* Usage */
.font-display { font-family: 'Syne', sans-serif; }  /* Heading, angka besar */
.font-body    { font-family: 'DM Sans', sans-serif; } /* Body, label, UI */
```

### Spacing & Radius
```
Border radius: 12px (card), 8px (badge/tag), 99px (pill)
Card padding: 16px mobile, 20px desktop
Gap antar section: 12px mobile, 16px desktop
```

---

## 6. PAGES TO BUILD

### 6.1 Layout (`src/app/dashboard/layout.tsx`)

**Desktop (≥768px):**
- Sticky top navbar
- Logo 🪲 Peeka di kiri
- Nav links di tengah: Overview | Transaksi | Pengeluaran | Piutang
- Tanggal hari ini di kanan
- Active state: link yang aktif punya underline atau pill background gelap
- Background navbar: `var(--bg-surface)`, border-bottom: `1px solid var(--border)`

**Mobile (<768px):**
- Sticky top bar: logo di kiri, tanggal di kanan (compact)
- Fixed bottom navigation: 4 tab (Overview, Transaksi, Keluar, Piutang)
- Bottom nav background: `var(--bg-surface)`, border-top: `1px solid var(--border)`
- Active tab: icon filled/bold + label bold + color `var(--accent-blue)`

**Content area:**
- Max width: 680px (mobile feel di semua screen)
- Centered, padding horizontal 16px
- Padding bottom 80px di mobile (biar tidak ketutup bottom nav)

---

### 6.2 Overview Page (`src/app/dashboard/page.tsx`)

**Hardcode untuk dev:**
```typescript
const TELEGRAM_ID = '387564171'
const TODAY = new Date().toISOString().split('T')[0]
```

**Layout sections (dari atas ke bawah):**

#### A. Header Section
- Label kecil uppercase: "LAPORAN HARI INI"
- Nama toko dalam font display besar (Syne, 26-28px, bold)
- Tombol refresh kecil di kanan (ikon RefreshCw, spin saat loading)
- Tanggal lengkap: "Sabtu, 18 April 2026"

#### B. Hero Metric Card — Laba Kotor
- Card penuh lebar, rounded-2xl
- **Kalau untung**: background `var(--ink)` (hitam), text putih — bold dan confident
- **Kalau rugi**: background `var(--danger-soft)`, border `var(--danger)`, text danger
- Isi card:
  - Label "LABA KOTOR" uppercase kecil
  - Angka laba besar (Syne, 40px+, font-bold)
  - Icon TrendingUp (hijau) atau TrendingDown (merah) di samping angka
  - Divider line
  - 3 kolom stat kecil: Penjualan | Pengeluaran | Transaksi

#### C. Stats 2 Column
- Card kiri: "Cash Masuk" — angka hijau
- Card kanan: "Piutang Baru" — angka kuning/oranye
- Style: `var(--bg-surface)`, border, border-radius 12px

#### D. Chart Omset per Jam
- AreaChart dari Recharts
- Tinggi: 120px mobile
- Stroke color: `var(--accent-blue)`
- Area gradient: biru ke transparan
- Hanya tampil kalau ada data (transaksi > 0)
- Tooltip format Rupiah

#### E. Piutang Aktif (kondisional)
- Hanya tampil kalau ada piutang aktif
- Background `var(--warning-soft)`, border `#FDE68A`
- Header: ikon AlertTriangle + "PIUTANG AKTIF" + total di kanan
- List nama + nominal, avatar huruf pertama nama
- Tampil max 4, sisanya "+N lainnya"

#### F. Transaksi Hari Ini
- Label section uppercase
- List card per transaksi
- Per item: ikon Receipt (hijau=cash, kuning=piutang) + nama items + nomor nota + nominal + waktu
- Nama pelanggan sebagai pill tag kuning (kalau piutang)
- Empty state dengan maskot 🪲

**Loading state:**
- Maskot 🪲 dengan animasi bounce di tengah halaman
- Teks "Memuat data warung..."

---

### 6.3 Transaksi Page (`src/app/dashboard/transaksi/page.tsx`)

**Features:**
- Filter tanggal (date picker atau preset: Hari ini, 7 hari, 30 hari)
- Filter status: Semua | Cash | Piutang
- List semua transaksi
- Per card transaksi:
  - Nomor nota (bold, monospace style)
  - Waktu transaksi
  - Nama pelanggan (kalau ada) + pill "piutang"
  - List items: "nasi ayam x2, es teh x3"
  - Total nominal (besar, bold)
  - Status badge: pill hijau "CASH" atau pill kuning "PIUTANG"
- Klik transaksi → expand untuk lihat detail items (accordion)
- Summary bar di atas list: total transaksi hari itu

---

### 6.4 Pengeluaran Page (`src/app/dashboard/pengeluaran/page.tsx`)

**Features:**
- Filter tanggal (sama seperti transaksi)
- Summary: total pengeluaran periode
- List pengeluaran
- Per item: kategori badge + catatan + nominal + waktu
- Kategori badge colors:
  - `bahan_baku` → biru muda
  - `gas_listrik` → kuning
  - `gaji` → hijau
  - `sewa` → ungu muda
  - `lain_lain` → abu

---

### 6.5 Piutang Page (`src/app/dashboard/piutang/page.tsx`)

**Features:**
- Tab: "Aktif" | "Lunas"
- Summary: total piutang aktif

**Per piutang card (aktif):**
- Avatar huruf nama (circle, bg `var(--warning-soft)`)
- Nama pelanggan (bold)
- Nomor nota + tanggal transaksi
- Progress bar: terbayar vs total hutang
- Nominal: total hutang, sudah bayar, sisa hutang
- Tombol "Catat Bayar" → modal/form input nominal bayar + catatan
- History cicilan (collapsible): list pembayaran sebelumnya

**Form Catat Bayar (modal atau slide-up sheet di mobile):**
- Input nominal (number, format Rupiah)
- Input catatan (optional)
- Info: sisa hutang sebelum bayar
- Tombol submit → POST /api/piutang
- Success state: update UI tanpa reload

**Per piutang card (lunas):**
- Sama tapi tone abu-abu
- Label "LUNAS" + tanggal lunas
- Tidak ada tombol bayar

---

## 7. UTILITY FUNCTIONS

Buat file `src/lib/format.ts`:
```typescript
// Format angka ke Rupiah ringkas (untuk display)
export const fmt = (n: number): string => {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt'
  if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + 'rb'
  return 'Rp ' + n
}

// Format Rupiah lengkap
export const fmtFull = (n: number): string =>
  'Rp ' + (n || 0).toLocaleString('id-ID')

// Format waktu dari ISO string
export const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

// Format tanggal Indonesia
export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

// Format tanggal pendek
export const fmtDateShort = (iso: string): string =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
```

---

## 8. COMPONENT LIBRARY

Buat folder `src/components/ui/` dengan komponen reusable:

### Badge.tsx
```typescript
// Props: label, color ('blue'|'yellow'|'green'|'red'|'gray'|'purple')
// Style: pill shape, uppercase, font-semibold, 10px
```

### StatCard.tsx
```typescript
// Props: label, value, subtext?, icon?, trend?('up'|'down')
// Style: bg-surface, border, rounded-xl, padding 16px
```

### SectionLabel.tsx
```typescript
// Props: children
// Style: uppercase, tracking-widest, text-xs, font-bold, ink-muted color
```

### EmptyState.tsx
```typescript
// Props: message, icon?
// Style: centered, mascot 🪲, muted text
```

### LoadingSpinner.tsx
```typescript
// Mascot 🪲 bounce animation centered
```

---

## 9. RESPONSIVE BREAKPOINTS

```
Mobile  : < 768px  → bottom nav, full-width cards, compact typography
Desktop : ≥ 768px  → top nav, max-width 680px centered, larger typography
```

Tidak perlu breakpoint yang lebih besar dari 768px — dashboard ini memang dirancang narrow/mobile-feel bahkan di desktop.

---

## 10. GLOBALS.CSS

Update `src/app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-base: #F8F7F4;
  --bg-surface: #FFFFFF;
  --bg-sunken: #F2F1EE;
  --border: #E8E5DF;
  --border-strong: #C8C5BF;
  --ink: #141210;
  --ink-secondary: #6B6560;
  --ink-muted: #A8A39D;
  --accent-blue: #60B4F7;
  --accent-blue-soft: #EDF6FF;
  --accent-yellow: #F0BC00;
  --accent-yellow-soft: #FFFBEB;
  --accent-pink: #FF8FAB;
  --success: #16A34A;
  --success-soft: #F0FDF4;
  --danger: #DC2626;
  --danger-soft: #FEF2F2;
  --warning: #D97706;
  --warning-soft: #FFFBEB;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg-base);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, .syne {
  font-family: 'Syne', sans-serif;
}
```

---

## 11. TAILWIND CONFIG

Update `tailwind.config.ts` tambahkan custom colors:

```typescript
theme: {
  extend: {
    colors: {
      ink: '#141210',
      'ink-secondary': '#6B6560',
      'ink-muted': '#A8A39D',
      'bg-base': '#F8F7F4',
      'bg-surface': '#FFFFFF',
      'bg-sunken': '#F2F1EE',
      border: '#E8E5DF',
      'accent-blue': '#60B4F7',
      'accent-yellow': '#F0BC00',
    },
    fontFamily: {
      display: ['Syne', 'sans-serif'],
      body: ['DM Sans', 'sans-serif'],
    },
    borderRadius: {
      '2xl': '16px',
      '3xl': '24px',
    }
  }
}
```

---

## 12. FILE STRUCTURE YANG HARUS DIBUAT

```
src/
├── app/
│   ├── globals.css                          ← UPDATE
│   ├── dashboard/
│   │   ├── layout.tsx                       ← CREATE
│   │   ├── page.tsx                         ← CREATE (Overview)
│   │   ├── transaksi/
│   │   │   └── page.tsx                     ← CREATE
│   │   ├── pengeluaran/
│   │   │   └── page.tsx                     ← CREATE
│   │   └── piutang/
│   │       └── page.tsx                     ← CREATE
├── components/
│   └── ui/
│       ├── Badge.tsx                        ← CREATE
│       ├── StatCard.tsx                     ← CREATE
│       ├── SectionLabel.tsx                 ← CREATE
│       ├── EmptyState.tsx                   ← CREATE
│       └── LoadingSpinner.tsx               ← CREATE
└── lib/
    └── format.ts                            ← CREATE
```

---

## 13. QUALITY CHECKLIST

Sebelum selesai, pastikan:

- [ ] Semua halaman responsive — test di 375px dan 768px+
- [ ] Loading state di setiap fetch
- [ ] Empty state di setiap list
- [ ] Error state kalau API gagal
- [ ] Format Rupiah konsisten (gunakan `fmt` atau `fmtFull`)
- [ ] Tidak ada `console.error` yang tidak di-handle
- [ ] TypeScript strict — tidak ada `any` yang unnecessary
- [ ] Font Syne dipakai untuk semua heading dan angka besar
- [ ] Font DM Sans dipakai untuk semua body/label
- [ ] Color tokens dari CSS variables, bukan hardcode hex
- [ ] Bottom nav di mobile tidak menutupi konten (padding-bottom: 80px)
- [ ] Tombol/interactive elements min 44px height (touch target)

---

## 14. REFERENSI DESIGN

**Inspirasi UI:** [4pto.io](https://www.4pto.io)

Yang diadopsi dari 4pto.io:
- Typography-driven layout (heading besar, label kecil uppercase tracking-widest)
- Border-based cards (bukan shadow)
- Clean section separation dengan line
- Numbered/labeled items yang styled
- High contrast tanpa dark mode

Yang disesuaikan untuk Peeka:
- Light mode (UMKM lebih familiar)
- Warm off-white background (bukan cool gray)
- Brand colors Peeka (biru, kuning, pink)
- Lebih compact dan data-dense (dashboard, bukan landing page)

---

## 15. CATATAN PENTING

1. **Hardcode TELEGRAM_ID** = `'387564171'` di semua page untuk sekarang (auth akan ditambah fase 2)
2. **Tanggal default** = hari ini (`new Date().toISOString().split('T')[0]`)
3. **Jangan ubah** file di `src/app/api/` dan `src/lib/supabase.ts` dan `src/types/index.ts`
4. **Semua fetch** di client component menggunakan `fetch('/api/...')` (relative URL)
5. **Error handling** — kalau API error, tampilkan empty state bukan crash

---

*Dokumen ini adalah satu-satunya source of truth. Jangan buat asumsi yang tidak tertulis di sini.*