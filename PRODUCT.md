# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Petugas Piket / Guru (Primary)**: Guru piket harian yang bertugas di koridor, gerbang, atau pintu masjid madrasah menjelang dan saat waktu shalat Dzuhur. Bertugas memindai kartu QR Code fisik milik ratusan siswa menggunakan kamera peramban smartphone (HP Android), dengan kebutuhan eksekusi super cepat (< 2 detik per siswa), konfirmasi instan via audio/haptik, serta pencarian manual NISN jika kartu rusak/tertinggal. Dibatasi pada kelas binaan yang ditugaskan (`assigned_classes`).
- **Administrator Madrasah**: Pengelola sistem yang bertugas mengunggah dan memvalidasi data induk siswa (kelas VII, VIII, IX) via Excel, mengelola siklus tahun ajaran aktif dan pengarsipan tahun lama, mencetak kartu presensi QR siswa massal (A4 landscape), serta mengelola akun pengguna dan pembagian kelas petugas piket.
- **Kepala Madrasah & Pimpinan**: Pemantau kedisiplinan ibadah siswa yang meninjau dasbor kehadiran langsung (realtime) saat ibadah berlangsung dan mengunduh rekapitulasi persentase kehadiran bulanan untuk evaluasi sekolah dan orang tua.

## Product Purpose

I-FLOW (Ibadah Fast, Logged, On-time, and Online-Way) menggantikan absensi manual berbasis kertas/tanda tangan yang lambat, rentan manipulasi, dan sulit direkap, dengan sistem pemindaian presensi digital instan berbasis QR Code kartu siswa terintegrasi. Sukses berarti pemindaian seluruh jamaah siswa madrasah dapat dituntaskan dalam jendela waktu shalat tanpa antrean panjang, kehadiran siswa tercatat akurat dan terverifikasi secara realtime, serta rekapitulasi bulanan per kelas dapat diakses transparan dalam hitungan detik.

## Positioning

Sistem presensi ibadah terpadu madrasah yang dirancang khusus untuk ritme jam shalat: memadukan pemindaian QR kamera mobile secepat kartu tapping RFID, toleransi keterlambatan dinamis berdasarkan konfigurasi adzan/iqamah madrasah, dan sistem pengarsipan otomatis antar tahun ajaran tanpa menghapus riwayat kehadiran terdahulu.

## Operating Context

- **Lingkungan Lapangan**: Koridor sekolah, teras masjid madrasah, dan gerbang dengan kondisi pencahayaan alami bervariasi, koneksi internet sekolah lokal (LAN / Wi-Fi madrasah), serta kebisingan saat pergantian jam pelajaran.
- **Perangkat Petugas**: Smartphone Android standar (layar sentuh, kamera belakang, peramban Chrome/Edge mobile).
- **Perangkat Admin/Pimpinan**: Laptop/PC desktop untuk import data Excel, cetak kartu QR A4, dan export matriks laporan bulanan.
- **Waktu Operasional**: Puncak pemindaian berada dalam jendela waktu shalat Dzuhur (konfigurasi default: 11:45 – 12:30 WIB) dengan batas toleransi keterlambatan (15 menit).

## Capabilities and Constraints

- **Single-Focus Scanner View**: Tampilan pemindai `/scan` dioptimalkan khusus mobile tanpa navigasi pengganggu, respons kamera < 1 detik, dengan pembedaan audio synthesizer (chime ganda untuk sukses, buzz untuk tolak/duplikat) dan haptic vibration.
- **Validasi Waktu Presensi & Toleransi**: Otomatisasi penentuan status kehadiran (`HADIR`, `TERLAMBAT`, atau `REJECTED`) berdasarkan jendela jam aktif.
- **Proteksi Penugasan Kelas**: Petugas piket hanya diizinkan memindai siswa pada kelas binaan yang ditugaskan kepadanya (`assigned_classes`), dengan penolakan `WRONG_CLASS` jika siswa dari kelas lain.
- **Pencegahan Duplikasi Presensi**: Menolak pemindaian ganda untuk siswa yang sama pada hari yang sama (`DUPLICATE`).
- **Koreksi & Pembatalan Aman**: Admin dan Petugas dapat mengoreksi status kehadiran siswa (`HADIR` / `TERLAMBAT`) atau membatalkan scan salah sasaran melalui modal verifikasi di dasbor realtime.
- **Arsip Siswa Per Tahun Ajaran**: Impor tahun ajaran baru mengarsipkan siswa lama (`archived` / soft-delete) tanpa menghapus rekaman riwayat presensi sebelumnya.
- **Skema Kertas Cetak Presensi**: Kartu QR presensi dicetak massal format A4 Landscape (8 kartu berukuran standar $85.6\text{ mm} \times 54\text{ mm}$ per lembar).

## Brand Commitments

- **Identitas Lembaga**: MTsN 3 Kota Padang (Kementerian Agama RI).
- **Nuansa & Warna**: Hijau Utama Islami (`#1B5E20`), Hijau Daun (`#2E7D32`), Aksen Emas (`#F9A825`), serta Netral Hangat (`Stone`).
- **Tipografi**: `Plus Jakarta Sans` untuk teks antarmuka dan instruksi, serta `JetBrains Mono` untuk identitas NISN, waktu jam digital, dan angka statistik.
- **Nama Produk**: I-FLOW (Ibadah Fast, Logged, On-time, and Online-Way) — Presensi Shalat Dzuhur Terpadu.

## Evidence on Hand

- **Dokumentasi PRD Lengkap**: Terarsip di `PRD/PRD.md`, `PRD/DESIGN.md`, `PRD/FEATURES.md`, dan `PRD/API.md`.
- **Basis Data Riwayat**: Skema MySQL dengan relasi siswa, kelas VII–IX, tahun ajaran aktif, dan log presensi harian.
- **Pengujian Terverifikasi**: 43 pengujian fitur PHPUnit (`tests/Feature/`) dan 7 skenario pengujian Playwright E2E (`e2e/`).

## Product Principles

1. **Kecepatan Lapangan Tanpa Hambatan**: Setiap milidetik berharga di pintu masjid; proses pemindaian kartu siswa harus selesai dalam satu gestur (< 2 detik) tanpa dialog konfirmasi yang memperlambat antrean.
2. **Umpan Balik Multi-Sensori Jelas**: Petugas tidak selalu menatap layar terus-menerus; status berhasil, terlambat, salah kelas, atau duplikat harus dapat dibedakan seketika melalui kombinasi visual, nada audio yang khas, dan getaran perangkat.
3. **Integritas & Akurasi Data**: Jam kehadiran, pembagian kelas petugas, dan rekaman status presensi tidak boleh dapat dimanipulasi; riwayat presensi siswa bersifat kekal dan tetap dapat diakses meskipun tahun ajaran berganti.
4. **Kesederhanaan Pengoperasian**: Alur kerja dirancang intuitif untuk seluruh staf pengajar; tugas teknis rumit (seperti validasi format Excel dan penataan kartu cetak A4) ditangani otomatis oleh sistem.

## Accessibility & Inclusion

- Target sentuh minimal 44 × 44 px untuk seluruh tombol aksi pada tampilan mobile.
- Rasio kontras teks dan latar belakang memenuhi standar WCAG AA (rasio kontras $\ge 4.5:1$).
- Informasi status tidak hanya bergantung pada warna (selalu dilengkapi teks label, ikon indikator, dan feedback suara/haptik).
