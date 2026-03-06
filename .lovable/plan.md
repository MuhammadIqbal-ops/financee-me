

# Rencana Pengembangan Selanjutnya — DompetPintar

Aplikasi DompetPintar sudah memiliki fitur yang cukup lengkap. Berikut adalah fitur-fitur yang bisa ditambahkan untuk meningkatkan kualitas dan pengalaman pengguna:

---

## 1. Export Data ke CSV/Excel
**Apa:** Tambahkan opsi export transaksi dan laporan ke format CSV selain PDF yang sudah ada.
**Kenapa:** Banyak pengguna ingin mengolah data keuangan mereka di spreadsheet.
**Cara:** Tambah tombol "Export CSV" di halaman Transaksi dan Laporan, buat utility `exportCsv.ts`.

## 2. Notifikasi Pengingat Budget
**Apa:** Kirim notifikasi otomatis ketika pengeluaran mendekati atau melebihi batas anggaran (80%, 100%).
**Kenapa:** Membantu pengguna tetap disiplin dengan anggaran.
**Cara:** Buat edge function yang cek budget vs pengeluaran secara berkala, kirim notifikasi via tabel `notifications`.

## 3. Multi-Wallet Transfer History
**Apa:** Tampilkan riwayat transfer antar dompet secara terpisah dengan visualisasi flow.
**Kenapa:** Saat ini transfer tercampur dengan transaksi biasa.
**Cara:** Buat halaman/tab khusus di Wallets untuk melihat history transfer dengan filter tanggal.

## 4. Dashboard Widget: Tren Pengeluaran Mingguan
**Apa:** Tambah widget baru di dashboard yang menampilkan tren pengeluaran per minggu dalam bulan berjalan.
**Kenapa:** Memberikan insight yang lebih granular dibanding hanya bulanan.
**Cara:** Buat komponen `WeeklyTrendChart`, tambahkan ke `WIDGET_MAP` di Dashboard.

## 5. Dark Mode Polish & Accessibility
**Apa:** Audit dan perbaiki konsistensi dark mode di seluruh halaman, tambahkan label accessibility (aria-label, focus states).
**Kenapa:** Meningkatkan pengalaman pengguna di mode gelap dan untuk pengguna dengan kebutuhan aksesibilitas.
**Cara:** Review semua halaman di dark mode, perbaiki kontras dan warna yang kurang konsisten.

---

## Prioritas yang Disarankan

| Urutan | Fitur | Dampak |
|--------|-------|--------|
| 1 | Export CSV | Tinggi — fitur yang sering diminta |
| 2 | Notifikasi Budget | Tinggi — membantu disiplin keuangan |
| 3 | Tren Mingguan | Sedang — insight tambahan |
| 4 | Transfer History | Sedang — organisasi data lebih baik |
| 5 | Dark Mode Polish | Sedang — kualitas UX |

Pilih fitur mana yang ingin dibangun lebih dulu, atau saya bisa mulai dari urutan prioritas di atas.

