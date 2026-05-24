
# Redesign Visual Penuh + Responsivitas Semua Device

Tujuan: refresh seluruh tampilan dengan arah desain baru (Midnight Indigo, Urbanist/Epilogue, dashboard klasik), navigasi hybrid mobile/desktop, dan memastikan setiap halaman & komponen berfungsi rapi di layar 320px hingga desktop.

---

## 1. Design System Baru (`src/index.css` + `tailwind.config.ts`)

Ganti token warna dan font ke arah Midnight Indigo:

- Font: import Urbanist (heading) + Epilogue (body) dari Google Fonts. Set di `html { font-family: 'Epilogue' }` dan tambah utility `.font-display` untuk Urbanist. Heading global pakai Urbanist via base layer.
- Palet (HSL, light & dark):
  - `--background`, `--card`, `--popover`: putih hangat di light, deep navy `#0a0a1a` di dark
  - `--primary`: indigo elektrik `#4f46e5` (kira-kira `hsl(243 75% 59%)`)
  - `--secondary`/`--muted`: navy lembut `#141432` / abu indigo
  - `--accent`: indigo terang untuk highlight
  - `--sidebar-*`: navy `#0a0a1a` dengan aksen indigo
  - `--income` (hijau emerald), `--expense` (merah coral) — tetap, tapi disesuaikan agar harmoni dengan indigo
- Gradien & shadow baru: `--gradient-primary` (indigo→violet), `--shadow-glow` (indigo glow halus untuk hover CTA).
- Default light theme dibuat tetap bersih (indigo accent on white) supaya kontras kuat di kedua mode.
- Hapus tema teal lama; tambah utility `.glass-indigo`, `.surface-elevated`, `.text-gradient-primary`.

## 2. Tipografi & Komponen Dasar

- Update `tailwind.config.ts`: `fontFamily.sans = ['Epilogue', ...]`, `fontFamily.display = ['Urbanist', ...]`. Tambah `boxShadow.glow`.
- `src/components/ui/button.tsx`: tambah varian `gradient` (gradient indigo + shadow glow) dan ukuran `xl`. Pastikan tinggi minimal 44px untuk touch target.
- `src/components/ui/card.tsx`: default rounded `xl`, padding responsif (`p-4 md:p-6`), border halus dengan ring indigo on hover.
- `src/components/dashboard/StatCard.tsx`: redesign — angka pakai font display besar, mini sparkline placeholder, ikon dalam pill gradient, tampilan stack di mobile.

## 3. Layout Aplikasi & Navigasi Hybrid (`src/components/layout/AppLayout.tsx` + sidebar baru)

- Desktop (≥md): tetap pakai `SidebarProvider` + `AppSidebar` (gaya navy gelap, indigo highlight pada item aktif, ikon + label, mini-collapse).
- Mobile (<md): sembunyikan sidebar default; tampilkan:
  - **Top app bar** ramping: judul halaman dinamis + tombol notifikasi + theme toggle + tombol "menu" (membuka drawer untuk menu sekunder seperti Activity Logs, Profile, Install).
  - **Bottom tab bar** baru `src/components/layout/MobileBottomNav.tsx`: 5 slot — Dashboard, Transactions, [FAB +], Reports, Wallets. Tombol FAB di tengah membuka sheet "Quick Action" (Tambah Transaksi / Transfer / Tambah Target).
  - Padding bawah pada `main` agar konten tidak tertutup bottom nav (`pb-20 md:pb-6`), aman area iOS.
- AppSidebar dirapikan: header berisi logo + nama app, grup menu utama & sekunder, indikator aktif berupa pill indigo.

## 4. Halaman per Halaman

Patokan responsif setiap halaman:
- Container: `px-4 md:px-6 lg:px-8`, `max-w-6xl` untuk halaman list, `max-w-7xl` untuk dashboard.
- Tabel: di `<md` ubah ke daftar kartu (1 kartu per row, label kiri/value kanan) memakai pola helper baru `ResponsiveDataList`.
- Form/dialog: di mobile pakai `Sheet` bottom drawer (memanfaatkan `vaul`) alih-alih `Dialog` lebar; di desktop tetap Dialog.

Halaman yang disentuh:
- **Dashboard**: layout grid 12-kolom desktop (sidebar widget kanan), single column di mobile. Hero saldo besar + StatCards + Cash Flow + Pie + Goals/Debts/Wallet/Recurring summary. Stagger animation tetap.
- **Transactions**: filter bar sticky (search + select kategori/dompet/tanggal). Mobile pakai sheet filter. Tabel → card list di mobile. Pagination/loadmore tetap.
- **Categories, Wallets, Debts, Goals, Recurring**: grid kartu responsif (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Tombol Tambah jadi FAB di mobile.
- **Reports**: chart responsif (Recharts `ResponsiveContainer`), tab horizontal scroll di mobile.
- **AI Advisor**: chat fullscreen mobile, input docked di bawah dengan safe-area.
- **Profile**: form 1 kolom, section card terpisah (Akun, Notifikasi, Preferensi, Keamanan).
- **Activity Logs**: timeline vertikal, di mobile satu kolom dengan badge tipe aktivitas.
- **Login/Register**: card center, lebar penuh - padding di mobile, ilustrasi/gradient indigo di sisi kanan desktop.
- **Index (landing)**: refresh blob/gradient ke palet indigo, hero copy Urbanist besar.
- **NotFound / Install**: padding & tipografi diselaraskan.

## 5. Komponen Pendukung Baru

- `src/components/layout/MobileBottomNav.tsx` — bottom tab + FAB.
- `src/components/layout/MobileTopBar.tsx` — header mobile dengan title dinamis (pakai `useLocation`).
- `src/components/QuickActionSheet.tsx` — sheet pilih aksi cepat.
- `src/components/common/ResponsiveDataList.tsx` — helper render list/table responsif.
- `src/components/common/PageHeader.tsx` — header halaman seragam (title + description + action slot).
- `src/components/common/EmptyState.tsx` & `LoadingSkeleton.tsx` — state seragam di semua halaman.

## 6. Polish & Animasi

- Pertahankan `page-transition`, `animate-stagger-in`, `hover-lift`.
- Tambah animasi fokus input (ring indigo), pulse halus pada FAB.
- Pastikan dark mode kontras AA pada semua text/badge.
- Tambah `prefers-reduced-motion` guard untuk animasi non-essensial.

## 7. QA Responsif

Verifikasi di viewport 360, 414, 768, 1024, 1440:
- Tidak ada horizontal scroll
- Bottom nav tidak menutupi konten / FAB tidak menutupi tombol primer
- Tabel jadi card list di <md
- Dialog/sheet bisa di-scroll & tertutup dengan benar
- Login/Register/Index tetap rapi tanpa sidebar

---

## Estimasi Sentuhan File

- Token & config: `src/index.css`, `tailwind.config.ts`, `index.html` (preload font)
- Layout & nav: `src/components/layout/AppLayout.tsx`, `AppSidebar.tsx`, + 3 file baru
- UI primitives: `button.tsx`, `card.tsx`, `StatCard.tsx`
- 13 halaman di `src/pages/*` (penyesuaian container, header, tabel → list, dialog → sheet di mobile)
- Komponen dashboard di `src/components/dashboard/*` (responsif & palet baru)

Tidak ada perubahan logika bisnis, hooks, atau skema database — murni presentasi.
