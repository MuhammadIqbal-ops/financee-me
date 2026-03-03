

# Plan Pengembangan Lanjutan DompetPintar

## Fitur yang Sudah Ada
Dashboard (filter bulan, charts, insights), Transaksi CRUD + wallet + receipt, Transaksi Berulang CRUD, Kategori & Anggaran, Target Keuangan, Dompet/Wallet, Hutang/Piutang, AI Advisor, Laporan + CSV Export, Profil, Notifikasi, PWA, Dark Mode.

---

## 5 Rekomendasi Fitur Berikutnya

### 1. Transfer Antar Wallet
Saat ini wallet sudah ada tapi belum bisa transfer antar wallet. Fitur ini memungkinkan user memindahkan saldo dari satu wallet ke wallet lain (misal: dari Bank ke GoPay), dengan history transfer tersendiri.

- Form transfer: pilih wallet asal, wallet tujuan, jumlah
- Otomatis kurangi saldo wallet asal, tambah saldo wallet tujuan
- Riwayat transfer di halaman Wallets
- Database: tabel baru `wallet_transfers` atau memanfaatkan transaksi dengan type `transfer`

### 2. Export Laporan PDF Profesional
Saat ini hanya ada CSV export. Tambahkan PDF export dengan layout profesional berisi ringkasan bulanan, breakdown kategori, dan grafik.

- Edge function untuk generate PDF (menggunakan library seperti jsPDF di client-side atau server-side rendering)
- Template: header DompetPintar, ringkasan pemasukan/pengeluaran/saldo, tabel kategori, top 5 transaksi
- Tombol "Export PDF" di halaman Laporan

### 3. Dashboard Widget Kustomisasi & Drag-Drop
Biarkan user memilih widget mana yang tampil di dashboard dan urutannya. Simpan preferensi di profil.

- Daftar widget yang bisa di-toggle: Budget, Goals, Recurring, Wallets, Debts, Insights
- Urutan bisa diatur
- Simpan preferensi di kolom baru `dashboard_layout` di tabel profiles (JSON)

### 4. Notifikasi & Reminder Otomatis
Sistem reminder untuk hutang jatuh tempo, anggaran mendekati batas, dan transaksi berulang yang akan diproses.

- Edge function scheduled (cron) untuk cek kondisi harian
- Push notification via PWA untuk budget warning (>80%), debt due date, recurring due
- Halaman notifikasi in-app dengan history

### 5. Multi-Currency & Konversi Otomatis
Saat ini currency hanya untuk display. Tambahkan dukungan transaksi dalam mata uang berbeda dengan konversi otomatis ke mata uang utama user.

- Kolom `currency` di tabel transactions
- Ambil exchange rate dari API gratis (via edge function)
- Konversi otomatis saat menampilkan total/stats
- Riwayat rate yang digunakan

---

## Rekomendasi Urutan Implementasi

1. **Transfer Antar Wallet** -- melengkapi fitur wallet yang sudah ada
2. **Export PDF** -- value tinggi, banyak user butuh laporan formal
3. **Notifikasi & Reminder** -- meningkatkan engagement
4. **Dashboard Kustomisasi** -- personalisasi
5. **Multi-Currency** -- kompleksitas tinggi, niche use case

Pilih satu atau beberapa fitur untuk diimplementasikan.

