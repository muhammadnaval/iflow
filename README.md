# I-FLOW (Ibadah Fast, Logged, On-time, and Online-Way)
### Sistem Presensi Sholat Berjamaah Berbasis QR Code
**MTsN 3 Kota Padang**

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react)](https://react.dev)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-v2-9553E9?style=flat&logo=inertia)](https://inertiajs.com)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

---

## 📌 Ringkasan Sistem

**I-FLOW** (*Ibadah Fast, Logged, On-time, and Online-Way*) adalah platform presensi digital yang dirancang khusus untuk memonitor, mendokumentasikan, dan merekapitulasi kehadiran siswa dalam kegiatan ibadah sholat berjamaah (Dzuhur & Dhuha) di **MTsN 3 Kota Padang** secara *real-time*, cepat, dan akurat.

- **Domain Produksi**: [https://iflow.mtsn3padang.sch.id](https://iflow.mtsn3padang.sch.id)
- **Instansi**: MTsN 3 Kota Padang, Kementerian Agama Republik Indonesia

---

## 🚀 Fitur Unggulan

1. **Scanner QR Code Berkecepatan Tinggi**:
   - Pemindaian kamera real-time dengan audio feedback (beeps) & visual haptic.
   - Deteksi ganda pencegahan presensi duplikat (*anti-duplicate check*).
   - Validasi jendela waktu ibadah (*prayer time window*).
   - Pencarian manual via NISN jika kartu siswa rusak/hilang.

2. **Dashboard Monitoring Real-time**:
   - Statistik kehadiran harian, persentase sholat berjamaah, dan status presensi.
   - Filter kelas interaktif, navigasi kalender, dan tren kehadiran mingguan.
   - Quick search data siswa dan rekap status (Hadir, Sakit, Izin, Alpa).

3. **Manajemen Siswa & Cetak Kartu QR**:
   - Import massal data siswa dari template Excel resmi.
   - Pembuatan ID Card & QR Token siswa siap cetak (grid layout & print stylesheet).

4. **Rekapitulasi & Laporan Bulanan**:
   - Matriks rekap presensi per bulan per rombel/kelas.
   - Export laporan ke spreadsheet Excel (`.xlsx`) resmi untuk pelaporan madrasah.

5. **Pengaturan Tahun Ajaran & Jendela Sholat**:
   - Konfigurasi tahun pelajaran aktif, semester, dan batas toleransi jam sholat.

6. **Manajemen Pengguna & Hak Akses Berjenjang**:
   - Role-Based Access Control (RBAC): `ADMIN`, `TEACHER`, `OFFICER`.
   - Audit trail dan status petugas aktif.

---

## 🛠️ Persyaratan Sistem

- PHP >= 8.2 (Disarankan PHP 8.3 / 8.5)
- Composer >= 2.x
- Node.js >= 20.x & NPM
- MySQL / MariaDB >= 8.0
- Web Server: Nginx / Apache / OpenLiteSpeed dengan dukungan HTTPS (SSL wajib untuk akses kamera PWA/QR Scanner di browser)

---

## ⚙️ Petunjuk Instalasi & Deployment

### 1. Clone Repositori
```bash
git clone https://github.com/muhammadnaval/iflow.git
cd iflow
```

### 2. Instal Dependensi
```bash
composer install --no-dev --optimize-autoloader
npm install
```

### 3. Konfigurasi Lingkungan (.env)
Salin contoh berkas konfigurasi:
```bash
cp .env.production.example .env
```
Sesuaikan konfigurasi database dan kredensial pada berkas `.env`, lalu generate APP_KEY:
```bash
php artisan key:generate
```

### 4. Migrasi & Seeding Akun Produksi
```bash
php artisan migrate --force
php artisan db:seed --class=ProductionAdminSeeder --force
```

### 5. Kompilasi Aset Frontend
```bash
npm run build
```

### 6. Optimasi Cache Produksi
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🔒 Keamanan & Praktik Terbaik

- **Enkripsi Token**: QR Token siswa di-hash dengan standar integritas tinggi untuk mencegah pemalsuan presensi.
- **Perlindungan Rute**: Seluruh modul internal dan scanner dilindungi dengan autentikasi berbasis sesi aman dan verifikasi middleware RBAC.
- **Proteksi Injeksi & Sanitasi**: Validasi ketat menggunakan Laravel Form Requests pada seluruh endpoint data.

---

## 📄 Hak Cipta & Lisensi

© 2026. **Tim IT MTsN 3 Kota Padang**. Hak Cipta Dilindungi.
Aplikasi ini dikembangkan untuk operasional internal madrasah.
