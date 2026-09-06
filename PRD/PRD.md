# PRD: DzuhurScan

## Executive Summary & Product Vision
DzuhurScan adalah aplikasi web presensi Shalat Dzuhur untuk MTsN 3 Kota Padang. Menggantikan pencatatan manual dengan pemindaian QR Code kartu siswa menggunakan HP Android. Data siswa diimpor dari template Excel untuk kelas VII–IX sekaligus, mengikuti kelas yang tertera di file. Setiap pergantian tahun ajaran, data lama diarsipkan, bukan dihapus. Dashboard realtime dan laporan bulanan per siswa disediakan untuk monitoring dan evaluasi.

## Problem Statement & Target Users
- Pencatatan presensi manual lambat, rawan kesalahan, dan sulit direkap.
- Tidak ada bukti presensi realtime; laporan bulanan memakan waktu.
- Target pengguna:
  - Administrator Madrasah: mengelola data induk, tahun ajaran, QR code.
  - Petugas Piket/Guru: memindai QR code siswa saat Dzuhur.
  - Kepala Madrasah: melihat laporan dan statistik kehadiran.

## System Scope & User Roles

| Kemampuan | Administrator | Petugas Piket | Kepala Madrasah |
|---:|---:|---:|---:|
| Import data siswa Excel | ✅ | ❌ | ❌ |
| Kelola tahun ajaran & arsip | ✅ | ❌ | ❌ |
| Generate QR code massal | ✅ | ❌ | ❌ |
| Scan QR presensi | ❌ | ✅ | ❌ |
| Lihat dashboard realtime | ✅ | ✅ | ✅ |
| Lihat laporan bulanan | ✅ | ❌ | ✅ |
| Kelola pengguna (petugas) | ✅ | ❌ | ❌ |

## Functional Requirements

- **FR-01 Import Data Siswa via Excel**: Admin mengunggah file .xlsx sesuai template. Sistem memvalidasi kolom NISN, nama, kelas, jenis kelamin. Data siswa kelas VII–IX diimpor sekaligus. Duplikat NISN ditolak. Kelas otomatis mengikuti kolom kelas di template.
- **FR-02 Skema Arsip Tahun Ajaran (Reimport)**: Admin membuat tahun ajaran baru. Saat import untuk tahun ajaran baru, data siswa lama ditandai `archived` (soft delete), bukan dihapus. Data pada tahun ajaran aktif digunakan untuk presensi.
- **FR-03 Generate QR Code Siswa**: Sistem menghasilkan QR code unik berdasarkan NISN setiap siswa aktif. QR code dapat dicetak massal untuk kartu siswa.
- **FR-04 Presensi Scan QR**: Petugas login pada HP Android, membuka halaman scan, lalu memindai kartu QR siswa. Sistem memverifikasi NISN terhadap data siswa aktif.
- **FR-05 Custom Presence Time Window**: Admin menentukan jendela waktu presensi harian (misal 11.45–12.30). Pemindaian di luar jendela waktu ditolak dan dicatat sebagai `REJECTED`.
- **FR-06 Duplicate Scan Handling**: Pemindaian kedua untuk siswa yang sama pada hari dan jendela waktu yang sama ditolak dengan notifikasi `DUPLICATE`. Hanya satu kehadiran valid per hari.
- **FR-07 Dashboard Realtime**: Presensi langsung tampil di dashboard menggunakan Laravel Echo + Pusher tanpa refresh. Menampilkan jumlah hadir, belum hadir, dan daftar siswa yang baru discan.
- **FR-08 Laporan Bulanan per Siswa**: Sistem menyajikan rekap kehadiran per siswa per bulan: total hadir, tidak hadir, terlambat, persentase kehadiran. Dapat difilter berdasarkan kelas dan rentang tanggal.
- **FR-09 Status Presensi**: Jika scan masuk dalam jendela waktu, status `HADIR`. Jika setelah waktu awal lebih dari batas toleransi, status `TERLAMBAT`; tetap di luar jendela ditolak.
- **FR-10 Manajemen Pengguna**: Admin dapat membuat akun petugas piket dan kepala madrasah dengan role-based access.
- **FR-11 Audit Trail**: Setiap pemindaian dan perubahan data penting dicatat timestamp dan user pelaku.

## Non-Functional Requirements

| Aspek | Target |
|---:|---:|
| Performa | Respon scan < 1 detik, dashboard realtime < 500 ms |
| Skalabilitas | Mendukung 1.000 siswa aktif dan 50 petugas bersamaan |
| Keamanan | Autentikasi Laravel Breeze, sanitasi input, HTTPS, proteksi CSRF |
| Ketersediaan | Uptime 99,5% selama jam aktif presensi |
| Usability | Tampilan modern bersih, responsive mobile, proses scan ≤ 2 langkah |
| Maintainability | Modular Laravel + React, pemisahan service untuk import & presensi |

## Technology Stack & Rationale

| Komponen | Teknologi | Alasan |
|---:|---:|---:|
| Frontend | React 19 + InertiaJS | SPA dinamis tanpa API terpisah; transisi halus dengan Laravel |
| Backend | Laravel 13 | Framework PHP modern, fitur queue, validation, soft delete untuk arsip |
| Database | MySQL | Relasional, mendukung relasi siswa–kelas–tahun ajaran–log presensi |
| Auth | Laravel Breeze | Autentikasi ringan siap pakai dengan session-based login |
| Realtime | Laravel Echo + Pusher | Update dashboard presensi langsung tanpa reload |
| QR Code | simplesoftwareio/simple-qrcode | Generate QR berbasis teks (NISN) cepat dan cetak massal |

## Success Metrics & KPIs

| Metrik | Target |
|---:|---:|
| Tingkat keberhasilan scan QR | ≥ 99% |
| Waktu pemindaian per siswa | < 2 detik |
| Reduksi waktu rekap bulanan | 90% lebih cepat |
| Akurasi data presensi vs manual | 100% valid |
| Adopsi petugas | 100% petugas menggunakan aplikasi |
| Waktu pembuatan laporan bulanan | < 10 detik |

## Risk Analysis & Mitigation

| Risiko | Dampak | Strategi Mitigasi |
|---:|---:|---:|
| Jaringan internet tidak stabil di area mushala | Scan gagal / dashboard tidak update | Queue offline di perangkat Android; retry otomatis saat koneksi pulih |
| QR code rusak / buram / tertukar | Siswa gagal discan | Pencarian manual by NISN di halaman scan; cetak ulang QR code |
| Import data tahun ajaran baru menimpa data lama | Data lama hilang | Skema arsip soft delete; konfirmasi tahun ajaran sebelum import |
| Presensi di luar jendela waktu | Siswa tidak tercatat | Atur buffer waktu; notifikasi khusus ke admin untuk kejadian di luar jadwal |
| Lonjakan pemindaian di awal waktu | Server lambat / timeout | Queue presensi dengan database transaction; horizontal scaling sederhana |

## Constraints & Assumptions
- Asumsi: tersedia koneksi internet di lokasi presensi; HP Android memiliki kamera; siswa memiliki kartu QR.
- Batasan: aplikasi web mobile, bukan native Android; template Excel disediakan oleh sekolah.
- Fitur presensi hanya untuk Shalat Dzuhur, bukan kegiatan lain.

## Out of Scope
- Aplikasi mobile native (Android/iOS).
- Presensi selain Shalat Dzuhur.
- Integrasi dengan sistem akademik eksternal (Dapodik, EMIS).
- Notifikasi SMS/WhatsApp.
- Alur izin/sakit tanpa scan.
- Multi-sekolah dalam satu instalasi.
- Pelacakan lokasi GPS atau biometrik.