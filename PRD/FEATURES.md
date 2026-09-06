# FEATURES.md: DzuhurScan

## 1. Ringkasan Modul

Dokumen ini merinci spesifikasi fungsional setiap modul aplikasi DzuhurScan. Setiap modul dijabarkan dalam bentuk user story, acceptance criteria, dan edge case yang wajib ditangani. Detail teknis seperti struktur database dan API endpoint dijelaskan pada dokumen terpisah — lihat **DATABASE.md** dan **API.md**.

| Modul | Kode | Deskripsi Singkat |
|:---|:---|:---|
| Autentikasi & Manajemen Pengguna | AUTH | Login, logout, dan CRUD akun petugas/kepala madrasah |
| Import Data Siswa | IMPORT | Unggah template Excel, validasi, dan impor massal kelas VII–IX |
| Arsip Tahun Ajaran | ARCHIVE | Pembuatan tahun ajaran baru dan arsip data lama |
| QR Code Siswa | QR | Generate dan cetak massal kartu QR berbasis NISN |
| Presensi Scan | SCAN | Pemindaian QR oleh petugas dengan validasi waktu |
| Dashboard Realtime | DASH | Tampilan live statistik presensi hari ini |
| Laporan Bulanan | REPORT | Rekap kehadiran per siswa per bulan |

## 2. Modul Autentikasi & Manajemen Pengguna (AUTH)

### 2.1 User Story AUTH-01
Sebagai Administrator, saya dapat login ke sistem menggunakan email dan password yang dikelola Laravel Breeze, sehingga saya dapat mengakses halaman admin.

**Acceptance Criteria:**
- Login menggunakan email + password dengan proteksi CSRF.
- Session berakhir setelah 120 menit tidak aktif.
- Role yang tersedia: `ADMIN`, `PETUGAS`, `KEPALA_MADRASAH`.

**Edge Case:**
- 5 kali gagal login → akun dikunci 15 menit.
- Akun non-aktif (soft-deleted) ditolak dengan pesan "Akun telah dinonaktifkan".

### 2.2 User Story AUTH-02
Sebagai Administrator, saya dapat membuat akun petugas piket dan kepala madrasah, sehingga mereka dapat mengakses fitur sesuai perannya.

**Acceptance Criteria:**
- Form berisi nama lengkap, email, password, dan role.
- Email harus unik; password minimal 8 karakter.
- Admin dapat mengaktifkan/menonaktifkan akun tanpa menghapus riwayat aktivitas.

**Edge Case:**
- Email duplikat → validasi ditolak dengan pesan spesifik.
- Admin mencoba menghapus akun diri sendiri → ditolak.

## 3. Modul Import Data Siswa (IMPORT)

### 3.1 User Story IMPORT-01
Sebagai Administrator, saya dapat mengunduh template Excel yang sudah disediakan sistem, sehingga data yang saya isi sesuai format yang diharapkan.

**Acceptance Criteria:**
- Template berisi kolom: `NISN`, `NAMA_LENGKAP`, `KELAS`, `JENIS_KELAMIN`.
- Template dapat diunduh kapan saja dari halaman Import.

### 3.2 User Story IMPORT-02
Sebagai Administrator, saya dapat mengunggah file .xlsx berisi data siswa kelas VII–IX sekaligus, sehingga data seluruh siswa aktif tercatat dalam sistem.

**Acceptance Criteria:**
- File divalidasi: ekstensi `.xlsx`, ukuran maksimal 5 MB, maksimal 2.000 baris.
- Setiap baris divalidasi:
  - `NISN` wajib 10 digit numerik unik.
  - `NAMA_LENGKAP` wajib diisi, minimal 3 karakter.
  - `KELAS` wajib sesuai pola `VII-A` sampai `IX-Z` (huruf kapital).
  - `JENIS_KELAMIN` wajib diisi `L` atau `P`.
- Jika terdapat baris gagal validasi, **seluruh import dibatalkan** (all-or-nothing) dan laporan error per baris ditampilkan.
- NISN duplikat terhadap data aktif → ditolak dan dicatat di laporan error.
- Kelas siswa otomatis mengikuti nilai kolom `KELAS` di template.

**Edge Case:**
- File dengan baris kosong di tengah → dilewati dengan warning.
- Format sel tanggal/angka tidak sesuai → dianggap error validasi.
- Import dilakukan saat tahun ajaran belum dibuat → sistem meminta pembuatan tahun ajaran terlebih dahulu.

## 4. Modul Arsip Tahun Ajaran (ARCHIVE)

### 4.1 User Story ARCHIVE-01
Sebagai Administrator, saya dapat membuat tahun ajaran baru (misal 2025/2026), sehingga data siswa tahun sebelumnya dapat diarsipkan.

**Acceptance Criteria:**
- Tahun ajaran memiliki format `YYYY/YYYY` (contoh: `2025/2026`).
- Hanya satu tahun ajaran berstatus `AKTIF` dalam satu waktu.
- Saat tahun ajaran baru dibuat, data siswa aktif lama otomatis ditandai `archived` (soft delete) dan tidak muncul di presensi.

### 4.2 User Story ARCHIVE-02
Sebagai Administrator, saya dapat mengimpor data siswa baru untuk tahun ajaran aktif, tanpa mengubah data arsip tahun sebelumnya.

**Acceptance Criteria:**
- Import siswa hanya diperbolehkan pada tahun ajaran berstatus `AKTIF`.
- Data arsip tetap dapat diakses untuk laporan historis.
- Riwayat presensi tahun ajaran lama tetap utuh dan terkait dengan data arsip.

**Edge Case:**
- Admin mencoba mengimpor NISN yang sama dengan data arsip → diperbolehkan, karena arsip dianggap entitas terpisah.
- Admin mencoba mengaktifkan tahun ajaran lama → ditolak sistem.

## 5. Modul QR Code Siswa (QR)

### 5.1 User Story QR-01
Sebagai Administrator, saya dapat generate QR code untuk seluruh siswa aktif secara massal, sehingga kartu siswa dapat dicetak.

**Acceptance Criteria:**
- QR code berisi payload teks `DZUHURSCAN:<NISN>` (contoh: `DZUHURSCAN:0012345678`).
- Halaman preview menampilkan grid QR + NISN + nama siswa untuk verifikasi.
- Output cetak berupa PDF A4 landscape dengan 8 kartu per halaman (ukuran kartu 85.6mm × 54mm).
- QR code hanya dibuat untuk siswa pada tahun ajaran aktif.

**Edge Case:**
- Siswa baru diimpor → QR code dapat di-generate ulang kapan saja; QR lama tetap valid karena berbasis NISN.
- Percetakan gagal di tengah proses → halaman cetak dapat di-refresh tanpa mengubah data.

## 6. Modul Presensi Scan (SCAN)

### 6.1 User Story SCAN-01
Sebagai Petugas Piket, saya dapat memindai kartu QR siswa menggunakan kamera HP Android, sehingga kehadiran siswa tercatat otomatis.

**Acceptance Criteria:**
- Halaman scan hanya dapat diakses oleh role `PETUGAS` dan `ADMIN`.
- Pemindaian menggunakan kamera belakang; hasil QR di-decode menjadi NISN.
- Sistem mencatat presensi dengan status berdasarkan jendela waktu (lihat SCAN-02).
- Respon setelah scan berhasil < 1 detik dengan feedback visual (vibrasi + warna hijau).

**Edge Case:**
- QR tidak terbaca (buram/rusak) → petugas dapat mencari manual via input NISN.
- Siswa tidak ditemukan pada tahun ajaran aktif → ditolak dengan pesan "Siswa tidak terdaftar aktif".
- Pemindaian ganda pada hari yang sama → ditolak dengan notifikasi `DUPLICATE` berwarna kuning.

### 6.2 User Story SCAN-02 (Custom Presence Time Window)
Sebagai Administrator, saya dapat mengatur jendela waktu presensi harian, sehingga presensi hanya valid pada rentang yang ditentukan.

**Acceptance Criteria:**
- Admin mengatur `waktu_mulai` (contoh: 11:45) dan `waktu_selesai` (contoh: 12:30) serta `batas_toleransi_terlambat` (contoh: 15 menit setelah waktu_mulai).
- Evaluasi status scan:
  - Sebelum `waktu_mulai` → ditolak, dicatat `REJECTED_EARLY`.
  - Antara `waktu_mulai` dan `waktu_mulai + toleransi` → status `HADIR`.
  - Setelah `waktu_mulai + toleransi` tapi sebelum `waktu_selesai` → status `TERLAMBAT`.
  - Setelah `waktu_selesai` → ditolak, dicatat `REJECTED_LATE`.

**Edge Case:**
- Jendela waktu melewati tengah malam (misal 23:50–00:10) → tidak didukung; batasi dalam satu hari kalender.
- Konfigurasi waktu diubah di tengah hari → perubahan berlaku untuk scan berikutnya, bukan retroaktif.

## 7. Modul Dashboard Realtime (DASH)

### 7.1 User Story DASH-01
Sebagai Petugas Piket dan Administrator, saya dapat melihat dashboard yang menampilkan statistik presensi hari ini secara realtime, sehingga saya dapat memantau perkembangan kehadiran tanpa me-refresh halaman.

**Acceptance Criteria:**
- Dashboard menampilkan: total siswa aktif, jumlah hadir, jumlah terlambat, jumlah belum hadir, dan progress bar persentase.
- Daftar 10 siswa terbaru yang berhasil discan muncul dengan animasi.
- Update realtime menggunakan Laravel Echo + Pusher pada channel `presensi.{tanggal}`; latensi < 500 ms.
- Dashboard otomatis mereset saat hari berganti.

**Edge Case:**
- Koneksi Pusher terputus → UI menampilkan indikator "offline" dan fallback polling setiap 30 detik.
- Belum ada presensi hari ini → dashboard menampilkan state kosong yang informatif.

## 8. Modul Laporan Bulanan (REPORT)

### 8.1 User Story REPORT-01
Sebagai Administrator dan Kepala Madrasah, saya dapat melihat laporan rekap kehadiran per siswa per bulan, sehingga saya dapat mengevaluasi kedisiplinan siswa.

**Acceptance Criteria:**
- Filter yang tersedia: bulan, tahun, dan kelas (opsional).
- Laporan menampilkan per siswa: total hari efektif, jumlah `HADIR`, `TERLAMBAT`, `TIDAK_HADIR`, dan persentase kehadiran.
- `TIDAK_HADIR` dihitung dari hari efektif (Senin–Jumat, minus hari libur nasional yang dikonfigurasi) dikurangi total scan valid.
- Laporan dapat diekspor ke PDF dan Excel.
- Waktu generate laporan < 10 detik untuk 1.000 siswa.

**Edge Case:**
- Bulan yang dipilih belum memiliki hari efektif → laporan kosong dengan pesan informatif.
- Siswa dipindah kelas di tengah bulan → laporan mengikuti kelas saat ini; riwayat perpindahan dicatat di audit trail.
- Hari libur nasional belum dikonfigurasi → sistem menggunakan default Senin–Jumat tanpa libur, dengan catatan di footer laporan.

## 9. Aturan Bisnis Lintas Modul

### 9.1 Status Presensi
| Status | Kode Internal | Deskripsi |
|:---|:---|:---|
| Hadir | `HADIR` | Scan dalam waktu mulai + toleransi |
| Terlambat | `TERLAMBAT` | Scan setelah toleransi, sebelum waktu selesai |
| Tidak Hadir | `TIDAK_HADIR` | Tidak ada scan valid (dihitung saat laporan) |
| Duplikat | `DUPLICATE` | Scan kedua di hari yang sama (ditolak) |
| Ditolak Awal | `REJECTED_EARLY` | Scan sebelum waktu mulai |
| Ditolak Akhir | `REJECTED_LATE` | Scan setelah waktu selesai |
| Siswa Tidak Ditemukan | `NOT_FOUND` | NISN tidak terdaftar aktif |

### 9.2 User Story CROSS-01
Sebagai Administrator, saya dapat melihat audit trail seluruh aktivitas penting, sehingga saya dapat melacak siapa yang melakukan perubahan.

**Acceptance Criteria:**
- Dicatat untuk: login, import siswa, pembuatan tahun ajaran, generate QR, setiap scan presensi, perubahan konfigurasi waktu.
- Setiap entri menyimpan: user, aksi, timestamp, dan detail (IP address untuk login).
- Hanya role `ADMIN` yang dapat mengakses halaman audit trail.