

# Rencana Redesign Dashboard

## Masalah Saat Ini
- Layout datar tanpa hierarki visual yang jelas
- Tidak ada greeting/personalisasi untuk user
- Chart ExpensePieChart dan CashFlowChart membungkus Card di dalam Card (double card)
- Tidak ada quick actions (tambah transaksi cepat)
- Tidak menampilkan progress budget dan goals
- Hardcoded `bg-white` dan `text-black` -- tidak support dark mode dengan benar
- Tidak ada animasi/transisi masuk

## Rencana Implementasi

### 1. Header dengan Greeting Personalisasi
- Tampilkan "Selamat pagi/siang/sore, [Nama]!" berdasarkan waktu dan nama dari profile
- Subtitle: ringkasan bulan berjalan

### 2. Fix Dark Mode & Double Card
- Hapus `bg-white` dan `text-black` hardcoded, ganti dengan token tema (`bg-background`, `text-foreground`)
- ExpensePieChart dan CashFlowChart sudah render Card sendiri -- di Dashboard cukup render komponen langsung tanpa wrapper Card

### 3. Quick Action Buttons
- Tombol floating atau inline: "Tambah Pemasukan" dan "Tambah Pengeluaran" yang navigate ke halaman Transactions dengan pre-filled type

### 4. Budget Progress Widget (baru)
- Komponen `BudgetSummary` yang menampilkan 3 budget teratas dengan progress bar
- Data dari `useBudgets` hook yang sudah ada
- Warna progress: hijau (<70%), kuning (70-90%), merah (>90%)

### 5. Goals Progress Widget (baru)  
- Komponen `GoalsSummary` menampilkan goals aktif dengan progress bar
- Data dari `useGoals` hook yang sudah ada

### 6. Animasi Staggered
- Setiap section muncul dengan `animate-slide-up` dan delay bertingkat menggunakan utility class yang sudah ada di `index.css`

### 7. Layout Responsif yang Lebih Baik
- Stat cards: 1 kolom (mobile) -> 3 kolom (desktop)
- Charts: 1 kolom (mobile) -> 2 kolom (desktop)  
- Budget + Goals widgets: 1 kolom (mobile) -> 2 kolom (desktop)
- Recent transactions tetap full width

## File yang Akan Diubah/Dibuat
| File | Aksi |
|------|------|
| `src/pages/Dashboard.tsx` | Refactor layout, fix dark mode, tambah greeting & quick actions |
| `src/components/dashboard/ExpensePieChart.tsx` | Hapus wrapper Card (biarkan parent yang kontrol) |
| `src/components/dashboard/CashFlowChart.tsx` | Hapus wrapper Card (biarkan parent yang kontrol) |
| `src/components/dashboard/BudgetSummary.tsx` | Buat baru -- widget progress budget |
| `src/components/dashboard/GoalsSummary.tsx` | Buat baru -- widget progress goals |

