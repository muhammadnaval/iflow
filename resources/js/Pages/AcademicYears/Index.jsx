import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/UI/StatusBadge';
import {
    Calendar,
    Clock,
    Plus,
    CheckCircle2,
    Save,
    Archive,
    AlertTriangle
} from 'lucide-react';

export default function AcademicYearsIndex({ auth, academicYears = [] }) {
    const activeYear = academicYears.find((y) => y.is_active) || academicYears[0] || {
        id: 1,
        name: '2025/2026',
        presence_start_time: '11:45',
        presence_end_time: '12:30',
        late_tolerance_minutes: 15,
    };

    // Time Window Form State
    const [startTime, setStartTime] = useState(activeYear.presence_start_time || '11:45');
    const [endTime, setEndTime] = useState(activeYear.presence_end_time || '12:30');
    const [lateTolerance, setLateTolerance] = useState(activeYear.late_tolerance_minutes ?? 15);
    const [isSavedAlert, setIsSavedAlert] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate threshold clock time dynamically
    const thresholdTime = useMemo(() => {
        if (!startTime) return '';
        const parts = startTime.split(':');
        if (parts.length < 2) return '';
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const totalMinutes = h * 60 + m + (parseInt(lateTolerance, 10) || 0);
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    }, [startTime, lateTolerance]);

    // Check if tolerance reaches or exceeds end time
    const isToleranceExceedingEnd = useMemo(() => {
        if (!startTime || !endTime) return false;
        const [sh, sm] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
        const [eh, em] = endTime.split(':').map((v) => parseInt(v, 10) || 0);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        const thresholdMins = startMins + (parseInt(lateTolerance, 10) || 0);
        return thresholdMins >= endMins;
    }, [startTime, endTime, lateTolerance]);

    // New Year Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [newYearName, setNewYearName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSaveTimeWindow = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formattedStart = startTime.length === 5 ? startTime + ':00' : startTime;
        const formattedEnd = endTime.length === 5 ? endTime + ':00' : endTime;

        router.post(route('admin.academic-years.time-window', activeYear.id), {
            presence_start_time: formattedStart,
            presence_end_time: formattedEnd,
            late_tolerance_minutes: parseInt(lateTolerance, 10) || 0,
        }, {
            onSuccess: () => {
                setIsSavedAlert(true);
                setTimeout(() => setIsSavedAlert(false), 3000);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleCreateNewYear = (e) => {
        e.preventDefault();
        router.post(route('admin.academic-years.store'), {
            name: newYearName,
            start_date: startDate,
            end_date: endDate,
        }, {
            onSuccess: () => {
                setModalOpen(false);
                setNewYearName('');
                setStartDate('');
                setEndDate('');
            },
        });
    };

    const handleActivateYear = (year) => {
        if (confirm(`Yakin ingin mengaktifkan Tahun Ajaran ${year.name}? Data siswa tahun lama akan diarsipkan.`)) {
            router.post(route('admin.academic-years.activate', year.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-madrasah-fg tracking-tight">
                            Tahun Ajaran & Jam Presensi
                        </h1>
                        <p className="text-xs text-madrasah-muted mt-0.5">
                            Konfigurasi tahun ajaran aktif, jendela waktu Shalat Dzuhur, dan toleransi keterlambatan
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold shadow-xs transition"
                    >
                        <Plus className="w-4 h-4 text-brand-accent" />
                        <span>Tambah Tahun Ajaran</span>
                    </button>
                </div>
            }
        >
            <Head title="Tahun Ajaran & Waktu Presensi - I-FLOW" />

            <div className="space-y-6 max-w-5xl mx-auto">
                {isSavedAlert && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Konfigurasi jendela waktu presensi berhasil disimpan ke database MySQL!</span>
                    </div>
                )}

                {/* Section 1: Time Window Configuration */}
                <div className="bg-white border border-madrasah-border rounded-xl p-5 sm:p-6 shadow-2xs">
                    <div className="flex items-center gap-3 pb-4 border-b border-madrasah-border">
                        <div className="p-2.5 rounded-lg bg-brand-50 text-brand-primary">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-madrasah-fg">
                                Pengaturan Jendela Waktu Presensi ({activeYear.name})
                            </h2>
                            <p className="text-xs text-madrasah-muted">
                                Menentukan rentang jam scan valid untuk status HADIR, TERLAMBAT, dan REJECTED
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveTimeWindow} className="mt-5 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Waktu Mulai Presensi (WIB)
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full text-sm font-mono font-bold rounded-lg border-madrasah-border focus:ring-brand-primary focus:border-brand-primary py-2"
                                    required
                                />
                                <span className="text-[11px] text-stone-500 mt-1.5 flex flex-wrap items-center gap-1.5">
                                    <span>Sebelum jam ini</span>
                                    <span className="text-stone-400 font-bold">→</span>
                                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px]">
                                        Ditolak Terlalu Awal (REJECTED_EARLY)
                                    </span>
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Toleransi Terlambat (Menit)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="240"
                                        value={lateTolerance}
                                        onChange={(e) => setLateTolerance(e.target.value)}
                                        className="w-full text-sm font-mono font-bold rounded-lg border-madrasah-border focus:ring-brand-primary focus:border-brand-primary py-2 pr-12"
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-semibold">
                                        Menit
                                    </span>
                                </div>
                                <span className="text-[11px] text-stone-500 mt-1.5 flex flex-wrap items-center gap-1.5">
                                    <span>
                                        Lewat batas toleransi {thresholdTime && <strong className="text-stone-700 font-mono font-semibold">({thresholdTime} WIB)</strong>} (+{lateTolerance} mnt)
                                    </span>
                                    <span className="text-stone-400 font-bold">→</span>
                                    <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                                        Tercatat TERLAMBAT
                                    </span>
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Waktu Akhir Presensi (WIB)
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full text-sm font-mono font-bold rounded-lg border-madrasah-border focus:ring-brand-primary focus:border-brand-primary py-2"
                                    required
                                />
                                <span className="text-[11px] text-stone-500 mt-1.5 flex flex-wrap items-center gap-1.5">
                                    <span>Setelah jam ini</span>
                                    <span className="text-stone-400 font-bold">→</span>
                                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px]">
                                        Ditolak Ditutup (REJECTED_LATE)
                                    </span>
                                </span>
                            </div>
                        </div>

                        {isToleranceExceedingEnd && (
                            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed shadow-2xs">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-bold text-amber-950">
                                        Perhatian: Batas toleransi ({thresholdTime} WIB) mencapai atau melewati Waktu Akhir Presensi ({endTime} WIB).
                                    </p>
                                    <p className="text-amber-900/90 text-[11px]">
                                        Dengan konfigurasi ini, siswa yang scan sebelum pukul {endTime} WIB akan selalu berstatus <span className="font-semibold text-emerald-800">HADIR</span>, dan setelah pukul {endTime} WIB akan langsung <span className="font-semibold text-rose-800">DITOLAK (DITUTUP)</span>. Status <span className="font-semibold text-amber-800">TERLAMBAT</span> tidak akan pernah tercapai kecuali Waktu Akhir Presensi dimundurkan melewati batas toleransi ({thresholdTime} WIB).
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-stone-950 font-bold text-xs shadow-xs transition"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Konfigurasi Waktu'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Section 2: List of Academic Years */}
                <div className="bg-white border border-madrasah-border rounded-xl p-5 sm:p-6 shadow-2xs">
                    <div className="flex items-center justify-between pb-4 border-b border-madrasah-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-stone-100 text-stone-700">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-madrasah-fg">
                                    Daftar Tahun Ajaran
                                </h2>
                                <p className="text-xs text-madrasah-muted">
                                    Hanya 1 tahun ajaran yang boleh berstatus aktif dalam satu waktu
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 divide-y divide-madrasah-border/60">
                        {academicYears.map((y) => (
                            <div key={y.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="font-extrabold text-base text-madrasah-fg">
                                            Tahun Ajaran {y.name}
                                        </h3>
                                        {y.is_active ? (
                                            <StatusBadge status="AKTIF" size="sm" />
                                        ) : (
                                            <StatusBadge status="ARSIP" size="sm" />
                                        )}
                                    </div>
                                    <p className="text-xs text-madrasah-muted">
                                        Periode: {y.start_date} s.d {y.end_date} • Siswa Terdaftar: <b>{y.total_students || 0} siswa</b>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {y.is_active ? (
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                            ✓ Sedang Digunakan
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleActivateYear(y)}
                                            className="text-xs font-bold text-brand-primary hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 transition"
                                        >
                                            Aktifkan Tahun Ini
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Tahun Ajaran */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white text-stone-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-stone-200">
                        <h2 className="text-base font-bold text-brand-primary">
                            Tambah Tahun Ajaran Baru
                        </h2>
                        <p className="text-xs text-madrasah-muted mt-0.5">
                            Format: YYYY/YYYY (contoh: 2026/2027)
                        </p>

                        <form onSubmit={handleCreateNewYear} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Nama Tahun Ajaran:
                                </label>
                                <input
                                    type="text"
                                    value={newYearName}
                                    onChange={(e) => setNewYearName(e.target.value)}
                                    placeholder="2026/2027"
                                    className="w-full text-xs font-bold rounded-lg border-stone-300 focus:ring-brand-primary focus:border-brand-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Tanggal Mulai:
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary focus:border-brand-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Tanggal Selesai:
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary focus:border-brand-primary"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-secondary"
                                >
                                    Simpan Tahun Ajaran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
