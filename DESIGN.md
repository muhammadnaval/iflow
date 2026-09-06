---
name: I-FLOW MTsN 3 Kota Padang
description: I-FLOW (Ibadah Fast, Logged, On-time, and Online-Way) — Presensi Shalat Dzuhur Terpadu Berbasis QR Code
colors:
  primary: "#1B5E20"
  secondary: "#2E7D32"
  accent: "#F9A825"
  neutral-bg: "#F5F5F4"
  surface: "#FFFFFF"
  foreground: "#1C1917"
  muted: "#78716C"
  border: "#E7E5E4"
  success: "#15803D"
  warning: "#D97706"
  danger: "#B91C1C"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  data:
    fontFamily: "JetBrains Mono, monospace"
    fontWeight: 700
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
---

## Overview

I-FLOW (Ibadah Fast, Logged, On-time, and Online-Way) memadukan identitas kelembagaan madrasah Kementerian Agama (hijau botol, aksen emas) dengan fungsionalitas operasional lapangan berkecepatan tinggi. Prinsip visual mengutamakan keterbacaan data instan di bawah cahaya matahari luar ruangan, interaksi sentuh berskala besar, serta estetika Islami modern yang bersih dan bermartabat tanpa ornamen berlebih.

## Colors

- **Hijau Utama (`#1B5E20`)**: Warna identitas institusional, mendominasi topbar, kartu CTA utama, dan indikator status resmi.
- **Hijau Daun (`#2E7D32`)**: Warna sekunder untuk interaksi hover, badge kehadiran tepat waktu (`HADIR`), dan aksen visual.
- **Aksen Emas (`#F9A825`)**: Warna pembeda untuk laser scan QR, status toleransi (`TERLAMBAT`), dan sorotan penting.
- **Netral Hangat (`Stone: #F5F5F4`, `#E7E5E4`)**: Menggantikan abu-abu dingin untuk menciptakan kenyamanan visual kertas dokumen resmi.

## Typography

- **Antarmuka Utama (`Plus Jakarta Sans`)**: Digunakan untuk seluruh heading, tombol aksi, panduan teks, dan navigasi.
- **Data Numerik & NISN (`JetBrains Mono`)**: Wajib digunakan untuk penulisan kode NISN, jam digital, statistik kehadiran, dan format waktu (`11:45:00`). Dilengkapi aturan global `font-variant-numeric: tabular-nums`.

## Layout

- **Prinsip Bento Grid**: Mengelompokkan pilar fitur ke dalam grid asimetris dengan hirarki visual yang kontras (fitur scanner lapangan berukuran lebih luas dibanding fitur pendukung).
- **Single-Focus Mobile Scanner**: Tampilan pemindai kamera (`/scan`) menggunakan seluruh tinggi layar perangkat tanpa sidebar maupun header pengganggu.
- **Desktop Command Shell**: Dasbor dan panel admin menggunakan navigasi vertikal tetap (sticky sidebar) dengan lebar 256px dan konten utama max-w-7xl.

## Elevation & Depth

- Bayangan lembut alami (`shadow-2xs`, `shadow-xs`, `shadow-sm`) dengan hairline border netral (`border-stone-200`).
- Dilarang keras menggunakan bayangan hitam pekat tanpa blur (`box-shadow: 4px 4px 0`) atau efek side-tab border tebal (`border-l-4`).

## Shapes

- Radius tombol dan kartu: `rounded-xl` (12px) hingga `rounded-2xl` (16px) untuk kartu informasi, dan `rounded-3xl` (24px) untuk banner hero utama.
- Sudut reticle kamera: Menggunakan aksen siku presisi `border-t-2 border-l-2` berwarna emas/amber.

## Components

- **MadrasahLogo**: Komponen visual utama dengan kubah masjid geometris minimalis, aksen emas, dan badge institusi `MTsN 3 Kota Padang`.
- **StatusBadge**: Indikator kehadiran multi-kanal (ikon + warna + teks kapital) untuk kepatuhan aksesibilitas WCAG AA.
- **StatCard**: Kartu KPI ringkas berangka besar monospaced dengan label kontras tinggi.

## Do's and Don'ts

- **DO**: Gunakan `text-amber-950` pada tombol berlatar belakang aksen emas (`#F9A825`) agar kontras teks tetap tajam.
- **DO**: Sediakan selalu teks label dan ikon pendukung di samping perubahan warna status.
- **DON'T**: Menggunakan teks gradien warna-warni pada judul.
- **DON'T**: Menggunakan emoji sebagai ikon antarmuka pengganti pustaka ikon resmi (`lucide-react`).
