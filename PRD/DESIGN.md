# DESIGN.md: DzuhurScan

## 1. Design Read (Evidence-Based)

- **Product:** DzuhurScan — Aplikasi web presensi Shalat Dzuhur berbasis QR Code untuk MTsN 3 Kota Padang
- **Target Audience:** Administrator madrasah, petugas piket/guru, dan kepala madrasah
- **Product Type:** Educational Platform
- **Primary User Goal:** Petugas piket memindai kartu QR siswa (< 2 detik) untuk mencatat kehadiran Shalat Dzuhur secara realtime
- **User Roles & Workflows:**
  - **Administrator:** Import data siswa via Excel, kelola tahun ajaran, generate QR massal, kelola pengguna, lihat dashboard
  - **Petugas Piket:** Scan QR via HP Android, cari manual by NISN jika QR gagal
  - **Kepala Madrasah:** Lihat dashboard dan laporan bulanan
- **Brand / Aesthetic Direction:** Institusional, utilitarian, bersih — mencerminkan lingkungan madrasah yang tertib dan formal. Fokus pada kecepatan pemindaian dan kejelasan data, bukan dekorasi.
- **Key Personality Traits:** Cermat, efisien, terpercaya

## 2. Design Dials (Context-Specific)

- **DESIGN_VARIANCE (3/10):** Data presensi bersifat sangat terstruktur dan konsisten. Variasi rendah menjaga konsistensi antar halaman dan memastikan petugas tidak bingung saat berpindah konteks. Variasi hanya pada halaman scan yang didesain berbeda untuk kebutuhan mobile.
- **MOTION_INTENSITY (2/10):** Petugas bekerja dengan kecepatan tinggi di lingkungan nyata. Animasi hanya digunakan untuk feedback scan berhasil/gagal (transisi opacity cepat) dan update realtime dashboard (fade-in). Tidak ada animasi dekoratif yang memperlambat.
- **VISUAL_DENSITY (7/10):** Dashboard dan laporan memuat banyak data (tabel siswa, statistik). Kepadatan tinggi diperlukan agar informasi lengkap tampil tanpa scroll berlebihan. Halaman scan justru sangat rendah kepadatannya karena fokus pada satu aksi.

## 3. Visual Identity & Product-Type Adaptation

Desain mengadaptasi kebutuhan Educational Platform dengan prioritas pada alur pemindaian dan tampilan data. Halaman scan didesain sebagai layar fokus tunggal dengan viewport kamera dominan dan feedback status besar. Dashboard menggunakan hierarki tipografis kuat: angka statistik besar, label kecil, dan tabel dengan hairline divider.

Daya pembeda visual berasal dari grid yang disiplin, kontras tipografis tinggi antara angka statistik dan label, serta aksen warna semantik yang jarang. Tidak ada gradien dekoratif, frosted glass, atau rounded box berlebihan. Identitas madrasah dimunculkan lewat kop header institusi pada halaman cetak QR dan laporan.

## 4. Semantic Color System (Color Discipline)

```css
:root {
  --color-primary: #1B5E20;      /* Hijau tua — identitas madrasah/Islami */
  --color-secondary: #2E7D32;    /* Hijau medium — elemen sekunder */
  --color-accent: #F9A825;       /* Kuning emas — CTA utama & state aktif */
  --color-success: #2E7D32;      /* Hijau — status HADIR */
  --color-warning: #F9A825;      /* Kuning — status TERLAMBAT */
  --color-danger: #C62828;       /* Merah — status REJECTED/GAGAL */
  --color-bg: #F5F5F5;           /* Abu sangat terang — latar halaman */
  --color-surface: #FFFFFF;      /* Putih — kartu/panel */
  --color-fg: #212121;           /* Hampir hitam — teks utama */
  --color-muted: #616161;        /* Abu — teks sekunder */
  --color-border: #E0E0E0;       /* Hairline */
}
```

**Aturan penggunaan:** Warna semantik (success/warning/danger) hanya untuk status presensi. `--color-accent` digunakan pada tombol primary dan highlight data aktif. Neutral (bg/surface/fg/muted/border) mencakup minimal 90% permukaan interface. Dilarang kombinasi gradien biru-ungu sebagai indikator teknologi.

## 5. Typography & Type Scale

**Font Families:** `Plus Jakarta Sans` untuk UI dan `JetBrains Mono` untuk data numerik (NISN, statistik). Plus Jakarta Sans dipilih karena memiliki geometri bersih dengan sentuhan hangat yang cocok untuk institusi pendidikan, sekaligus readable pada ukuran kecil di perangkat mobile. JetBrains Mono untuk angka statistik dan NISN memberikan presisi visual dan mencegah kesalahan baca digit.

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

| Level | Size | Weight | Line-Height | Tracking | Rationale |
|:---|:---|:---|:---|:---|:---|
| h1 (Page Title) | 1.5rem/24px | 800 | 1.3 | -0.01em | Judul halaman, tegas |
| h2 (Section) | 1.25rem/20px | 700 | 1.4 | -0.01em | Pembagian seksi |
| h3 (Subsection) | 1.125rem/18px | 600 | 1.4 | 0 | Sub-judul panel |
| Body | 0.875rem/14px | 400 | 1.5 | 0 | Teks utama, nyaman dibaca |
| Body Small | 0.8125rem/13px | 400 | 1.5 | 0 | Teks sekunder, tabel |
| Caption | 0.75rem/12px | 500 | 1.4 | 0.01em | Label, timestamp |
| Mono Stat | 2rem/32px | 700 | 1.2 | -0.02em | Angka utama dashboard |

## 6. Layout Strategy & Anti-Repetition Rules

**Pola layout spesifik per konteks:**

- **Halaman Scan:** Layout fokus tunggal — viewport kamera sentral (rasio 4:3), area feedback status di bawah, tombol pencarian manual sebagai secondary action. Tanpa sidebar.
- **Dashboard:** Layout Master/Detail — panel statistik ringkas di atas (4 kolom angka), daftar presensi terbaru sebagai master list, detail siswa muncul pada panel kanan saat dipilih.
- **Import & Tahun Ajaran:** Layout form wizard bertahap (upload → validasi → konfirmasi) dengan progress indicator horizontal.
- **Laporan Bulanan:** Layout tabel komparatif dengan filter bar di atas (kelas, rentang tanggal). Tidak ada kartu statistik berulang.
- **Manajemen Data:** Layout data list dengan toolbar aksi, bukan grid kartu.

**Grid & Spacing:** Sistem grid 12 kolom dengan gutter 16px (mobile) / 24px (desktop). Spacing unit berbasis 4px: 4, 8, 12, 16, 24, 32, 48px. Margin halaman 16px mobile, 32px desktop. Konten max-width 1200px.

## 7. Anti-AI-Slop Rules

- **Avoid:** Generic three-card feature grids. → **Prefer:** Tabel data, master-detail, dan wizard layout sesuai konteks.
- **Avoid:** Setiap seksi dibungkus rounded card. → **Prefer:** Pemisahan via whitespace, hairline divider, dan alignment konten.
- **Avoid:** Gradien biru/ungu AI atau background mesh glow. → **Prefer:** Flat neutral tone dengan aksen semantik kontras tinggi yang jarang.
- **Avoid:** Icon dekoratif dan abstract shapes. → **Prefer:** Hierarki tipografis langsung, status label, icon fungsional (scan, filter, export).
- **Avoid:** Animasi layout berat. → **Prefer:** Transisi opacity/transform performa tinggi hanya untuk feedback interaksi.

## 8. Card & Container Discipline

**Card diizinkan** untuk: widget statistik dashboard (karena bersifat independen dan dapat disusun ulang), panel detail siswa pada master-detail view.

**Card dilarang** untuk: seksi teks biasa, form, daftar item, navigasi — gunakan whitespace dan hairline divider.

**Card nesting dilarang keras.** Satu card = satu unit konten. Konten di dalam card tidak boleh memiliki card lagi.

## 9. Component Rules & Action Hierarchy

**Button tiers:**
- **Primary:** Background `--color-accent`, teks gelap kontras tinggi. Satu per viewport. Untuk aksi utama (Scan, Import, Generate QR, Simpan).
- **Secondary:** Outline 1px `--color-border`, teks `--color-fg`. Untuk aksi pendukung (Export, Filter, Cetak).
- **Tertiary:** Text-only, teks `--color-muted`. Untuk aksi kontekstual (Batal, Detail).

**State visuals:**
- **Hover:** Darken 5% pada primary/secondary; underline pada tertiary.
- **Focus:** Ring 2px offset `--color-primary` di luar elemen.
- **Disabled:** Opacity 40%, cursor not-allowed.
- **Selected:** Background `--color-primary` 10% + border kiri 3px `--color-primary`.
- **Active:** Scale 0.98 pada button.

Semua state kontras memenuhi WCAG AA (min 4.5:1 untuk teks).

## 10. Behavioral Responsive Design

| Breakpoint | Perilaku |
|:---|:---|
| Mobile (< 640px) | Sidebar collapse jadi bottom nav 4 item; tabel menyembunyikan kolom sekunder (kelas, waktu); dashboard statistik jadi 2 kolom; master-detail stack vertikal |
| Tablet (640–1024px) | Sidebar jadi icon-only; tabel tampil dengan horizontal scroll; dashboard 4 kolom statistik tetap |
| Desktop (> 1024px) | Sidebar penuh dengan label; master-detail grid 2/3–1/3; tabel penuh |

Halaman scan selalu single-column di semua breakpoint. Filter bar pada laporan berubah dari inline menjadi dropdown stack di mobile.

## 11. States (Loading, Empty, Error)

- **Loading State:** Skeleton loader berbentuk persis container asli — baris tabel dengan lebar bervariasi, blok statistik persegi. Tidak ada spinner infinite generik.
- **Empty State:** Pesan kontekstual + aksi langsung. Contoh: "Belum ada data siswa. Impor data dari template Excel untuk memulai." dengan tombol "Impor Data". "Belum ada presensi hari ini. Scan kartu siswa untuk memulai."
- **Error State:** Alert dengan ikon fungsional, deskripsi error spesifik, dan tombol retry. Contoh: "Gagal terhubung ke server. Periksa koneksi internet Anda." + tombol "Coba Lagi". Untuk scan gagal: overlay merah dengan pesan "QR tidak dikenali" + tombol "Coba Scan Ulang" dan "Cari Manual".

## 12. Accessibility & Inclusivity (WCAG 2.1 AA)

- **Keyboard Navigation:** Semua aksi dapat diakses via Tab; focus order logis (filter → konten → aksi).
- **Focus Rings:** Visible ring minimal 2px offset di semua elemen interaktif.
- **ARIA:** `role="status"` untuk feedback scan; `aria-live="polite"` untuk update realtime; label eksplisit untuk semua form field.
- **Touch Target:** Minimum 44×44px untuk semua elemen interaktif di mobile.
- **Status Multi-Kanal:** Status presisi dikomunikasikan via teks + ikon + warna, tidak hanya warna. Contoh: status HADIR = teks "Hadir" + ikon check + warna hijau.

## 13. Design Rationale

Keputusan desain berakar langsung pada kebutuhan operasional PRD. Halaman scan didesain ultra-sederhana karena target FR-04: petugas memindai < 2 detik di HP Android dengan satu tangan. Dashboard realtime (FR-07) menggunakan layout statistik + daftar untuk memenuhi kebutuhan admin dan kepala madrasah melihat status langsung tanpa interaksi berlebih. Laporan bulanan (FR-08) mengutamakan tabel padat dengan filter karena volumenya besar (1.000 siswa × 30 hari). Skema warna hijau-emas merefleksikan identitas madrasah dan memberikan asosiasi visual tenang-institusional, bukan sekadar tren estetik. Tabel dan hairline divider dipilih atas rounded cards agar data 1.000 siswa dapat ditampilkan secara efisien tanpa noise visual.

## 14. NO Invented Design Content Rule

Dilarang membuat testimoni palsu, logo pengguna fiktif, screenshot abstrak, atau statistik tidak nyata. Seluruh konten visual dan tekstual harus berasal dari scope proyek nyata: data siswa MTsN 3 Kota Padang, kelas VII–IX, tahun ajaran aktual, dan fitur sesuai PRD. Mock data hanya diizinkan untuk demo teknis dengan label jelas "Data Contoh".

## 15. Design Pre-Flight Checklist

- [x] Design is derived from PRD/project context.
- [x] Design Read is specific.
- [x] Design dials are intentional.
- [x] Visual direction is justified.
- [x] Color hierarchy is intentional.
- [x] Typography is intentional.
- [x] Cards are not overused.
- [x] Layouts are not repetitive.
- [x] No generic AI aesthetic was introduced without justification.
- [x] Motion has a purpose.
- [x] Responsive behavior is defined.
- [x] Loading states are defined where relevant.
- [x] Empty states are defined where relevant.
- [x] Error states are defined where relevant.
- [x] Accessibility is defined.
- [x] No fake content was invented.
- [x] Design feels specific to the product.
- [x] A coding agent can implement the design without inventing major visual decisions.
- [x] Design System is cohesive and reusable.