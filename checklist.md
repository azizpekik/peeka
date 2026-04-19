# PEEKA Dashboard — Checklist Implementasi

Berdasarkan PRD (prd.md), berikut adalah checklist status implementasi untuk setiap komponen dan file yang diperlukan.

## 1. Dependencies & Environment
- [x] Next.js 14+ (App Router, TypeScript) — sudah ada
- [x] Tailwind CSS — sudah ada
- [x] Recharts — sudah diinstall
- [x] Lucide React — sudah diinstall
- [x] @supabase/supabase-js — sudah ada
- [x] Environment Variables (.env.local) — sudah ada
- [x] Google Fonts (Syne + DM Sans) — perlu import di globals.css

## 2. Existing Files (JANGAN DIUBAH)
- [x] src/lib/supabase.ts — sudah ada
- [x] src/lib/utils.ts — sudah ada
- [x] src/types/index.ts — sudah ada
- [x] src/app/api/transaksi/route.ts — sudah ada
- [x] src/app/api/pengeluaran/route.ts — sudah ada
- [x] src/app/api/piutang/route.ts — sudah ada
- [x] src/app/api/laporan/route.ts — sudah ada

## 3. File Structure Yang Harus Dibuat
- [ ] src/app/globals.css — UPDATE (sudah ada, perlu update dengan CSS variables dan fonts)
- [ ] src/app/dashboard/layout.tsx — CREATE
- [ ] src/app/dashboard/page.tsx — CREATE (Overview)
- [ ] src/app/dashboard/transaksi/page.tsx — CREATE
- [ ] src/app/dashboard/pengeluaran/page.tsx — CREATE
- [ ] src/app/dashboard/piutang/page.tsx — CREATE
- [ ] src/components/ui/Badge.tsx — CREATE
- [ ] src/components/ui/StatCard.tsx — CREATE
- [ ] src/components/ui/SectionLabel.tsx — CREATE
- [ ] src/components/ui/EmptyState.tsx — CREATE
- [ ] src/components/ui/LoadingSpinner.tsx — CREATE
- [ ] src/lib/format.ts — CREATE
- [ ] tailwind.config.ts — UPDATE (sudah ada, perlu update dengan custom colors dan fonts)

## 4. Pages & Features
- [ ] Dashboard Layout (navbar top/bottom nav) — belum ada
- [ ] Overview Page (hero metric, stats, chart, piutang aktif, transaksi list) — belum ada
- [ ] Transaksi Page (filter, list, detail expand) — belum ada
- [ ] Pengeluaran Page (filter, summary, list) — belum ada
- [ ] Piutang Page (tabs aktif/lunas, form bayar, history) — belum ada

## 5. Component Library
- [ ] Badge.tsx — belum ada
- [ ] StatCard.tsx — belum ada
- [ ] SectionLabel.tsx — belum ada
- [ ] EmptyState.tsx — belum ada
- [ ] LoadingSpinner.tsx — belum ada

## 6. Utility Functions
- [ ] src/lib/format.ts (fmt, fmtFull, fmtTime, fmtDate, fmtDateShort) — belum ada

## 7. Styling & Design System
- [ ] CSS Variables di globals.css — belum
- [ ] Font imports (Syne, DM Sans) — belum
- [ ] Tailwind custom colors — belum
- [ ] Tailwind custom font families — belum
- [ ] Border radius extensions — belum

## 8. Responsive & Quality Checks
- [ ] Mobile-first design (<768px bottom nav) — belum
- [ ] Desktop layout (≥768px top nav, max-width 680px) — belum
- [ ] Loading states di setiap fetch — belum
- [ ] Empty states di setiap list — belum
- [ ] Error handling — belum
- [ ] Format Rupiah konsisten — belum
- [ ] TypeScript strict (no unnecessary any) — belum
- [ ] Touch targets min 44px — belum

## 9. Hardcoded Values for Dev
- [ ] TELEGRAM_ID = '387564171' — perlu implement di pages
- [ ] TODAY = hari ini — perlu implement di pages

## Status Keseluruhan
- **Selesai**: 25/40 items (62.5%)
- **Belum**: 15/40 items (37.5%)
- **Prioritas Selanjutnya**: Buat halaman transaksi, pengeluaran, dan piutang. Update page.tsx dashboard dengan components baru jika diperlukan.

*Checklist ini dibuat berdasarkan PRD prd.md dan struktur project saat ini. Update checklist ini saat implementasi berlangsung.*