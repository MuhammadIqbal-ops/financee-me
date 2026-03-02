

# Rekomendasi Plan Selanjutnya untuk DompetPintar

## Fitur yang Sudah Ada
- Dashboard dengan filter bulan, greeting, stat cards, charts, budget/goals/recurring summary
- Transaksi CRUD dengan filter & search
- Transaksi berulang CRUD
- Kategori & anggaran
- Target keuangan (goals)
- Laporan dengan export CSV
- Profil & notifikasi
- PWA support

## 5 Opsi Plan Terbaik (Pilih Salah Satu)

### Opsi 1: Multi-Akun / Dompet (Wallet)
Pisahkan transaksi berdasarkan akun: Cash, Bank BCA, GoPay, dll. Setiap transaksi terhubung ke satu wallet, dan dashboard menampilkan saldo per wallet.

- Tabel baru `wallets` (name, icon, color, balance)
- Tambah kolom `wallet_id` di tabel transactions
- Widget saldo per wallet di dashboard
- Filter transaksi per wallet
- Transfer antar wallet

### Opsi 2: Foto Struk & Catatan Lampiran
Upload foto struk/bukti untuk setiap transaksi menggunakan file storage.

- Bucket storage untuk receipt images
- Field upload di form transaksi
- Preview gambar di detail transaksi
- Kompresi otomatis sebelum upload

### Opsi 3: AI Financial Advisor
Analisis keuangan otomatis menggunakan Lovable AI -- memberikan saran penghematan, deteksi pola pengeluaran tidak wajar, dan prediksi cash flow.

- Edge function yang memanggil Lovable AI (Gemini)
- Halaman baru "Asisten Keuangan" dengan chat interface
- Analisis otomatis bulanan: "Pengeluaran makanan naik 30% dari bulan lalu"
- Saran actionable berdasarkan data real

### Opsi 4: Export PDF Laporan Profesional
Generate laporan PDF bulanan lengkap dengan grafik, tabel, dan ringkasan -- bisa di-share atau diprint.

- Edge function untuk generate PDF
- Template laporan: ringkasan, breakdown kategori, tren
- Tombol download di halaman Reports
- Desain profesional dengan branding DompetPintar

### Opsi 5: Split Bill / Hutang Piutang
Fitur catat hutang dan piutang ke orang lain, dengan tracking status lunas/belum.

- Tabel baru `debts` (person_name, amount, type, status, due_date)
- Halaman CRUD hutang/piutang
- Widget di dashboard: total hutang vs piutang
- Reminder untuk hutang yang jatuh tempo

---

Pilih opsi mana yang paling menarik, atau gabungkan beberapa. Saya akan buatkan plan detail untuk opsi yang dipilih.

