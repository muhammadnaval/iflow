import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MadrasahLogo from '@/Components/MadrasahLogo';
import {
    QrCode,
    Clock,
    ShieldCheck,
    FileSpreadsheet,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Smartphone,
    SlidersHorizontal,
    Layers,
    Volume2,
    Vibrate,
    School,
    Users,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';

export default function Welcome({ auth, activeYear = '2025/2026', presenceWindow }) {
    const user = auth?.user;
    const startTime = presenceWindow?.start_time || '11:45';
    const endTime = presenceWindow?.end_time || '12:30';
    const tolerance = presenceWindow?.tolerance || 15;

    return (
        <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-brand-primary/20 selection:text-brand-primary flex flex-col font-sans">
            <Head title="I-FLOW — Presensi Shalat Dzuhur MTsN 3 Kota Padang" />

            {/* Topbar Institusional */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MadrasahLogo showText={true} />
                    </div>

                    {/* Nav Status & CTA */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-xs font-semibold text-brand-primary">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Tahun Ajaran {activeYear}</span>
                        </div>

                        {user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold transition shadow-xs"
                            >
                                <span>Buka Dashboard</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold transition shadow-xs"
                            >
                                <span>Masuk ke Sistem</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-stone-200 bg-white">
                    {/* Background Islamic Geometric Subtle Patterns */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#1B5E20_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute -top-24 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="max-w-3xl">
                            {/* Live Presence Status Pill */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 mb-6">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                </span>
                                <span>Presensi Shalat Dzuhur Berjamaah MTsN 3 Kota Padang</span>
                            </div>

                            {/* Main Value Headline */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.15]">
                                Kedisiplinan Ibadah Siswa Terpantau Cepat, Tertib, dan Realtime.
                            </h1>

                            <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
                                Menggantikan absensi kertas manual dengan pemindaian kartu QR Code siswa berkecepatan tinggi di selasar dan gerbang masjid. Waktu shalat terkalibrasi presisi, rekapitulasi instan, dan bebas antrean.
                            </p>

                            {/* Dual Primary CTA */}
                            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                                {user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm transition shadow-sm"
                                    >
                                        <span>Buka Dashboard Presensi</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm transition shadow-sm"
                                    >
                                        <span>Masuk sebagai Petugas / Admin</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}

                                <a
                                    href="#workflow-mosaic"
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 font-semibold text-sm transition border border-stone-200"
                                >
                                    <span>Pelajari Alur Kerja</span>
                                    <ChevronRight className="w-4 h-4 text-stone-500" />
                                </a>
                            </div>

                            {/* Micro Stat Ticker */}
                            <div className="mt-12 pt-8 border-t border-stone-100 grid grid-cols-3 gap-4 sm:gap-8 max-w-xl">
                                <div>
                                    <div className="font-mono text-2xl font-extrabold text-brand-primary">
                                        &lt; 1.5s
                                    </div>
                                    <div className="text-xs text-stone-500 mt-0.5 font-medium">
                                        Scan Kartu per Siswa
                                    </div>
                                </div>
                                <div>
                                    <div className="font-mono text-2xl font-extrabold text-stone-900">
                                        100%
                                    </div>
                                    <div className="text-xs text-stone-500 mt-0.5 font-medium">
                                        Bebas Pindai Duplikat
                                    </div>
                                </div>
                                <div>
                                    <div className="font-mono text-2xl font-extrabold text-amber-700">
                                        Kelas VII–IX
                                    </div>
                                    <div className="text-xs text-stone-500 mt-0.5 font-medium">
                                        Arsip Terintegrasi
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Bento Grid Workflow Mosaic */}
                <section id="workflow-mosaic" className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-primary mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Arsitektur Sistem</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                            Empat Pilar Presensi Terpadu I-FLOW
                        </h2>
                        <p className="mt-2 text-sm text-stone-600">
                            Setiap komponen dirancang untuk memudahkan guru piket di lapangan dan menjamin keakuratan laporan bagi pimpinan madrasah.
                        </p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Bento 1: Field Scanner (Wide: col-span-2) */}
                        <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-brand-primary/50 transition">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-brand-primary text-brand-accent flex items-center justify-center mb-5">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-stone-900">
                                    Pemindai Kamera Single-Focus Mobile
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
                                    Tampilan pemindai khusus HP Android tanpa navigasi yang membingungkan. Dilengkapi umpan balik audio synthesizer khas (chime ganda untuk sukses, buzz untuk tolak) serta getaran haptik instan.
                                </p>
                            </div>

                            {/* Interactive Mock Scanner Card Preview */}
                            <div className="mt-6 p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs border border-stone-800">
                                <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[11px] text-stone-400">
                                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                        KAMERA AKTIF
                                    </span>
                                    <span>Jendela: {startTime} – {endTime} WIB</span>
                                </div>

                                <div className="mt-3 flex items-center gap-3 bg-stone-800/80 p-3 rounded-lg border border-stone-700">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-emerald-400 font-bold text-xs uppercase tracking-wide">
                                            HADIR TEPAT WAKTU
                                        </div>
                                        <div className="text-stone-200 font-sans font-bold text-xs truncate">
                                            Ahmad Fauzi Pratama
                                        </div>
                                        <div className="text-[10px] text-stone-400">
                                            NISN: 0078123401 • Kelas VII-A
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-stone-400">
                                        <Volume2 className="w-4 h-4 text-amber-400" />
                                        <Vibrate className="w-4 h-4 text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bento 2: Automated Time Windows (col-span-1) */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-brand-primary/50 transition">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-5">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-stone-900">
                                    Jendela Waktu Presisi
                                </h3>
                                <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                                    Otomatisasi status kehadiran berdasarkan ritme adzan dan iqamah madrasah tanpa input manual.
                                </p>
                            </div>

                            {/* Timeline Graphic */}
                            <div className="mt-6 space-y-2.5 font-mono text-[11px]">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
                                    <span className="text-stone-600">Mulai Scan:</span>
                                    <span className="font-bold text-stone-900">{startTime} WIB</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                                    <span>Toleransi ({tolerance} mnt):</span>
                                    <span className="font-bold text-amber-800">12:00 WIB</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-950">
                                    <span>Tutup Presensi:</span>
                                    <span className="font-bold text-rose-800">{endTime} WIB</span>
                                </div>
                            </div>
                        </div>

                        {/* Bento 3: Officer Class Guard (col-span-1) */}
                        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-brand-primary/50 transition">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mb-5">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-stone-900">
                                    Proteksi Penugasan Kelas
                                </h3>
                                <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                                    Petugas piket hanya memindai kelas yang ditugaskan. Sistem otomatis menolak siswa dari kelas lain guna mencegah tumpang tindih verifikasi.
                                </p>
                            </div>

                            <div className="mt-6 p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                                <div className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                                    <span>Tugas Petugas 1:</span>
                                    <span className="text-emerald-700 font-mono">VII-A, VII-B, VII-C</span>
                                </div>
                                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-[10px] text-rose-900 font-sans font-medium">
                                    ⛔ Siswa Kelas VIII-A otomatis ditolak (WRONG_CLASS)
                                </div>
                            </div>
                        </div>

                        {/* Bento 4: Realtime Pusher & Excel Reporting (Wide: col-span-2) */}
                        <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-brand-primary/50 transition">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-primary border border-brand-200 flex items-center justify-center mb-5">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-stone-900">
                                    Dasbor Realtime & Laporan Siap Cetak
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
                                    Setiap pemindaian di gerbang langsung muncul di layar kepala madrasah detik itu juga. Dilengkapi ekspor rekapitulasi bulanan ke format resmi Excel (.xlsx) per kelas.
                                </p>
                            </div>

                            {/* Realtime KPI Preview */}
                            <div className="mt-6 grid grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
                                    <div className="text-[10px] font-bold uppercase text-emerald-800">Hadir Tepat</div>
                                    <div className="font-mono text-lg font-extrabold text-emerald-900 mt-0.5">85.4%</div>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
                                    <div className="text-[10px] font-bold uppercase text-amber-800">Terlambat</div>
                                    <div className="font-mono text-lg font-extrabold text-amber-900 mt-0.5">7.2%</div>
                                </div>
                                <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-center">
                                    <div className="text-[10px] font-bold uppercase text-stone-600">Ekspor Excel</div>
                                    <div className="font-mono text-xs font-bold text-brand-primary mt-1 flex items-center justify-center gap-1">
                                        <span>.XLSX</span>
                                        <ArrowUpRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: 3-Step Field Flow */}
                <section className="py-16 bg-white border-t border-b border-stone-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-xl mb-12">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                                Tiga Langkah Alur Presensi di Madrasah
                            </h2>
                            <p className="mt-2 text-sm text-stone-600">
                                Dirancang agar pelaksanaan shalat berjamaah tetap khusyuk tanpa terganggu antrean panjang.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <div className="w-8 h-8 rounded-full bg-brand-primary text-white font-bold font-mono flex items-center justify-center text-sm shadow-xs">
                                    1
                                </div>
                                <h3 className="text-base font-bold text-stone-900">
                                    Kartu Siswa Dicetak Massal
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed">
                                    Admin menghasilkan kartu QR Code dari NISN siswa aktif. Format cetak A4 landscape standar (8 kartu per lembar) siap laminasi.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="w-8 h-8 rounded-full bg-brand-primary text-white font-bold font-mono flex items-center justify-center text-sm shadow-xs">
                                    2
                                </div>
                                <h3 className="text-base font-bold text-stone-900">
                                    Scan Sekali di Pintu Masjid
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed">
                                    Siswa menunjukkan kartu ke kamera petugas piket. Notifikasi audio chime memastikan presensi tercatat tanpa harus berhenti berjalan.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="w-8 h-8 rounded-full bg-brand-primary text-white font-bold font-mono flex items-center justify-center text-sm shadow-xs">
                                    3
                                </div>
                                <h3 className="text-base font-bold text-stone-900">
                                    Pemantauan Realtime & Rekap
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed">
                                    Dasbor madrasah dan wali kelas menerima data detik itu juga. Siswa yang belum hadir dapat segera dikonfirmasi oleh petugas.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: CTA Banner */}
                <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl bg-brand-primary text-white p-8 sm:p-12 relative overflow-hidden shadow-lg">
                        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-brand-secondary/50 pointer-events-none"></div>
                        <div className="max-w-2xl relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-accent text-xs font-semibold mb-4 border border-white/10">
                                <School className="w-3.5 h-3.5" />
                                <span>Madrasah Tsanawiyah Negeri 3 Kota Padang</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                Siap Melaksanakan Presensi Shalat Hari Ini?
                            </h2>
                            <p className="mt-3 text-sm text-stone-200 leading-relaxed">
                                Masuk menggunakan akun petugas piket atau administrator untuk memulai pemindaian kamera dan membuka dasbor realtime.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-amber-950 font-extrabold text-xs sm:text-sm hover:bg-amber-300 transition shadow-xs"
                                >
                                    <span>Masuk ke Akun Anda</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition border border-white/20"
                                >
                                    <span>Lihat Dasbor Publik</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-stone-200 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                        <MadrasahLogo className="w-6 h-6" />
                        <span className="font-semibold text-stone-700">I-FLOW</span>
                        <span>—</span>
                        <span>MTsN 3 Kota Padang</span>
                    </div>

                    <div className="text-center sm:text-right">
                        <span>© 2026. Tim IT MTsN 3 Kota Padang</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
