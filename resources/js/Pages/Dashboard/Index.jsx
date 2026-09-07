import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/UI/StatCard';
import StatusBadge from '@/Components/UI/StatusBadge';
import {
    Users,
    CheckCircle2,
    Clock,
    UserX,
    QrCode,
    Search,
    Radio,
    RefreshCw,
    ArrowUpRight,
    SlidersHorizontal,
    Trash2,
    AlertTriangle,
    X,
    ShieldCheck,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import axios from 'axios';

export default function Dashboard({ auth, stats, initialScans = [], availableClasses = [] }) {
    const userRole = (auth?.user?.role || 'admin').toLowerCase();
    const canEditAttendance = ['admin', 'petugas'].includes(userRole);

    const classOptions = availableClasses?.length > 0
        ? availableClasses
        : (stats?.available_classes?.length > 0 ? stats.available_classes : [
            '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10',
            '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10',
            '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10',
            'VII-A', 'VII-B', 'VII-C', 'VIII-A', 'VIII-B', 'VIII-C', 'IX-A', 'IX-B', 'IX-C',
        ]);

    // Stats & Scans State from Database
    const [currentStats, setCurrentStats] = useState(stats || {
        total_students: 54,
        total_present: 36,
        total_late: 6,
        total_absent: 12,
        percentage: 77.8,
        presence_window: { start_time: '11:45:00', end_time: '12:30:00', late_tolerance_minutes: 15 },
        academic_year: '2025/2026',
    });

    const [scans, setScans] = useState(initialScans || stats?.recent_scans || []);
    const [selectedScan, setSelectedScan] = useState(scans[0] || null);
    const [selectedClass, setSelectedClass] = useState('ALL');
    const [selectedOfficer, setSelectedOfficer] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // Correction Modal State
    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [targetScan, setTargetScan] = useState(null);
    const [correctionStatus, setCorrectionStatus] = useState('HADIR');
    const [correctionReason, setCorrectionReason] = useState('');
    const [isSavingCorrection, setIsSavingCorrection] = useState(false);
    const [isDeletingAttendance, setIsDeletingAttendance] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    // Sync when props change
    useEffect(() => {
        if (stats) {
            setCurrentStats(stats);
            if (stats.recent_scans) {
                setScans(stats.recent_scans);
                if (!selectedScan && stats.recent_scans.length > 0) {
                    setSelectedScan(stats.recent_scans[0]);
                }
            }
        }
    }, [stats]);

    // Live Fallback Polling (Every 15s)
    const fetchLiveUpdates = async () => {
        setIsRefreshing(true);
        try {
            const response = await axios.get(route('dashboard'), {
                headers: { Accept: 'application/json' },
            });
            if (response.data?.success && response.data?.data) {
                const liveData = response.data.data;
                setCurrentStats(liveData);
                setScans(liveData.recent_scans || []);
            }
        } catch (e) {
            console.warn('Live poll error', e);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Open Correction Modal
    const openCorrectionModal = (scan) => {
        setTargetScan(scan);
        setCorrectionStatus(scan.status === 'TERLAMBAT' ? 'TERLAMBAT' : 'HADIR');
        setCorrectionReason(scan.reject_reason || '');
        setConfirmDeleteOpen(false);
        setCorrectionModalOpen(true);
    };

    // Submit Attendance Correction
    const handleSaveCorrection = (e) => {
        e.preventDefault();
        if (!targetScan) return;

        setIsSavingCorrection(true);
        router.put(route('attendance.update', targetScan.id), {
            status: correctionStatus,
            reject_reason: correctionReason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCorrectionModalOpen(false);
                setSuccessMessage(`Status presensi siswa ${targetScan.student_name} berhasil diubah ke ${correctionStatus}.`);
            },
            onFinish: () => setIsSavingCorrection(false),
        });
    };

    // Delete Attendance Scan
    const handleDeleteAttendance = () => {
        if (!targetScan) return;

        setIsDeletingAttendance(true);
        router.delete(route('attendance.destroy', targetScan.id), {
            preserveScroll: true,
            onSuccess: () => {
                setCorrectionModalOpen(false);
                setConfirmDeleteOpen(false);
                if (selectedScan?.id === targetScan.id) {
                    setSelectedScan(null);
                }
                setSuccessMessage(`Rekaman presensi siswa ${targetScan.student_name} berhasil dibatalkan.`);
            },
            onFinish: () => setIsDeletingAttendance(false),
        });
    };

    // Unique officers list from scans
    const availableOfficers = Array.from(
        new Set(scans.map((s) => s.scanned_by).filter(Boolean))
    ).sort();

    // Filter Scans by Class, Officer, and Search query
    const filteredScans = scans.filter((scan) => {
        const matchesClass = selectedClass === 'ALL' || scan.class === selectedClass;
        const matchesOfficer = selectedOfficer === 'ALL' || scan.scanned_by === selectedOfficer;
        const matchesQuery =
            scan.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scan.nisn.includes(searchQuery);
        return matchesClass && matchesOfficer && matchesQuery;
    });

    const totalItems = filteredScans.length;
    const isAll = perPage === 'ALL';
    const effectivePerPage = isAll ? Math.max(1, totalItems) : Number(perPage);
    const totalPages = Math.max(1, Math.ceil(totalItems / effectivePerPage));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safeCurrentPage - 1) * effectivePerPage;
    const endIndex = isAll ? totalItems : Math.min(startIndex + effectivePerPage, totalItems);
    const paginatedScans = isAll ? filteredScans : filteredScans.slice(startIndex, endIndex);

    const getPageNumbers = (current, total) => {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 4) {
            return [1, 2, 3, 4, 5, '...', total];
        }
        if (current >= total - 3) {
            return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        }
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const handleClassChange = (e) => {
        setSelectedClass(e.target.value);
        setCurrentPage(1);
    };

    const handleOfficerChange = (e) => {
        setSelectedOfficer(e.target.value);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handlePerPageChange = (e) => {
        const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
        setPerPage(val);
        setCurrentPage(1);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-madrasah-fg tracking-tight flex items-center gap-2">
                            <span>Dashboard Presensi Shalat Dzuhur</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                                Live
                            </span>
                        </h1>
                        <p className="text-xs text-madrasah-muted mt-0.5">
                            Monitoring kehadiran Shalat Dzuhur hari ini — Tahun Ajaran {currentStats.academic_year}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={fetchLiveUpdates}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-300 transition"
                            title="Segarkan Data Realtime"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-primary' : ''}`} />
                            <span>Segarkan</span>
                        </button>

                        {['admin', 'petugas'].includes(userRole) && (
                            <Link
                                href={route('scan.index')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold shadow-sm transition active:scale-98"
                            >
                                <QrCode className="w-4 h-4 text-brand-accent" />
                                <span>Buka Scanner Kamera</span>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Dashboard Realtime - I-FLOW" />

            <div className="space-y-6">
                {/* Alert Notification */}
                {successMessage && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>{successMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSuccessMessage(null)}
                            className="text-emerald-700 hover:text-emerald-900"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* 4 Statistics KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard
                        title="Total Siswa Aktif"
                        value={currentStats.total_students}
                        unit="Siswa"
                        subtitle="Kelas VII, VIII, IX"
                        icon={Users}
                        iconColor="text-brand-primary"
                        iconBg="bg-brand-50"
                    />
                    <StatCard
                        title="Hadir Tepat Waktu"
                        value={currentStats.total_present}
                        unit="Siswa"
                        subtitle="Presensi ≤ Toleransi"
                        icon={CheckCircle2}
                        iconColor="text-emerald-700"
                        iconBg="bg-emerald-50"
                    />
                    <StatCard
                        title="Terlambat"
                        value={currentStats.total_late}
                        unit="Siswa"
                        subtitle="Presensi > Toleransi"
                        icon={Clock}
                        iconColor="text-amber-700"
                        iconBg="bg-amber-50"
                        badge={currentStats.total_late > 0 ? "Perlu Pembinaan" : null}
                        badgeType="warning"
                    />
                    <StatCard
                        title="Belum Hadir / Alpha"
                        value={currentStats.total_absent}
                        unit="Siswa"
                        subtitle="Belum melakukan presensi"
                        icon={UserX}
                        iconColor="text-rose-700"
                        iconBg="bg-rose-50"
                        badge="Monitoring"
                        badgeType="danger"
                    />
                </div>

                {/* Overall Attendance Progress Bar */}
                <div className="bg-white border border-madrasah-border rounded-xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-madrasah-muted">
                                Tingkat Kehadiran Shalat Dzuhur Hari Ini
                            </span>
                            <span className="text-xs font-bold text-brand-primary">
                                ({currentStats.total_present + currentStats.total_late} dari {currentStats.total_students} Siswa)
                            </span>
                        </div>
                        <span className="font-mono text-lg font-black text-brand-primary">
                            {currentStats.percentage}%
                        </span>
                    </div>

                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex border border-stone-200">
                        <div
                            style={{ width: `${(currentStats.total_present / (currentStats.total_students || 1)) * 100}%` }}
                            className="bg-emerald-600 transition-all duration-500"
                            title={`Hadir: ${currentStats.total_present}`}
                        ></div>
                        <div
                            style={{ width: `${(currentStats.total_late / (currentStats.total_students || 1)) * 100}%` }}
                            className="bg-amber-400 transition-all duration-500"
                            title={`Terlambat: ${currentStats.total_late}`}
                        ></div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-madrasah-muted">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                            Tepat Waktu ({((currentStats.total_present / (currentStats.total_students || 1)) * 100).toFixed(1)}%)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                            Terlambat ({((currentStats.total_late / (currentStats.total_students || 1)) * 100).toFixed(1)}%)
                        </span>
                        <span className="flex items-center gap-1.5 ml-auto text-stone-500 font-mono">
                            Jendela: {currentStats.presence_window?.start_time?.substring(0, 5) || '11:45'} – {currentStats.presence_window?.end_time?.substring(0, 5) || '12:30'} WIB
                        </span>
                    </div>
                </div>

                {/* Master-Detail Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Master: Live Scans List */}
                    <div className="lg:col-span-2 bg-white border border-madrasah-border rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-madrasah-border">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-madrasah-fg">
                                    Presensi Terbaru Hari Ini
                                </h2>
                                <span className="text-xs bg-stone-100 text-stone-700 font-mono px-2 py-0.5 rounded-full">
                                    {filteredScans.length} data
                                </span>
                            </div>

                            {/* Filters Bar */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative flex-1 sm:w-44">
                                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        placeholder="Cari siswa / NISN..."
                                        className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border-madrasah-border focus:border-brand-primary focus:ring-brand-primary"
                                    />
                                </div>

                                <select
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                    aria-label="Filter Kelas"
                                    className="py-1 px-2.5 text-xs rounded-lg border-madrasah-border focus:border-brand-primary focus:ring-brand-primary bg-stone-50 font-medium"
                                >
                                    <option value="ALL">Semua Kelas</option>
                                    {classOptions.map((cls) => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedOfficer}
                                    onChange={handleOfficerChange}
                                    aria-label="Filter Petugas"
                                    className="py-1 px-2.5 text-xs rounded-lg border-madrasah-border focus:border-brand-primary focus:ring-brand-primary bg-stone-50 font-medium max-w-[140px] sm:max-w-[180px] truncate"
                                >
                                    <option value="ALL">Semua Petugas</option>
                                    {availableOfficers.map((officer) => (
                                        <option key={officer} value={officer}>{officer}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Table View */}
                        <div className="mt-3 flex-1 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-madrasah-border text-madrasah-muted uppercase font-bold text-[10px] tracking-wider">
                                        <th className="py-2.5 px-3">Siswa</th>
                                        <th className="py-2.5 px-3">Kelas</th>
                                        <th className="py-2.5 px-3">Waktu Scan</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-madrasah-border/60 font-sans">
                                    {paginatedScans.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-10 text-center">
                                                <div className="flex flex-col items-center justify-center max-w-xs mx-auto text-center">
                                                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
                                                        <QrCode className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-xs font-bold text-stone-700">Belum Ada Presensi Hari Ini</p>
                                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                                        Data kehadiran akan muncul otomatis saat petugas memindai kartu QR siswa.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedScans.map((scan) => {
                                            const isSelected = selectedScan?.id === scan.id;
                                            return (
                                                <tr
                                                    key={scan.id}
                                                    onClick={() => setSelectedScan(scan)}
                                                    className={`hover:bg-stone-50 cursor-pointer transition ${
                                                        isSelected ? 'bg-brand-50/50 font-semibold' : ''
                                                    }`}
                                                >
                                                    <td className="py-3 px-3">
                                                        <div className="font-bold text-madrasah-fg">
                                                            {scan.student_name}
                                                        </div>
                                                        <div className="font-mono text-[10px] text-stone-500">
                                                            {scan.nisn}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 font-semibold text-stone-700">
                                                        {scan.class}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="font-mono text-stone-700 font-semibold">
                                                            {scan.scanned_at}
                                                        </div>
                                                        <div className="text-[10px] text-stone-500 font-medium truncate max-w-[130px]" title={scan.scanned_by || 'Petugas Piket'}>
                                                            Oleh: {scan.scanned_by || 'Petugas Piket'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <StatusBadge status={scan.status} size="sm" />
                                                    </td>
                                                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => openCorrectionModal(scan)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-primary bg-brand-50/50 hover:bg-brand-100 hover:text-brand-secondary border border-brand-200 transition shadow-2xs"
                                                            title="Buka Detail & Koreksi Presensi Siswa"
                                                        >
                                                            <SlidersHorizontal className="w-3.5 h-3.5" />
                                                            <span>Koreksi</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalItems > 0 && (
                            <div className="pt-3 mt-auto border-t border-madrasah-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-madrasah-muted">
                                <div className="flex items-center gap-3">
                                    <span>
                                        Menampilkan <b className="text-stone-800">{isAll ? 1 : (startIndex + 1)}</b> – <b className="text-stone-800">{endIndex}</b> dari <b className="text-stone-800">{totalItems}</b> presensi
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-stone-400">Baris:</span>
                                        <select
                                            value={perPage}
                                            onChange={handlePerPageChange}
                                            aria-label="Jumlah per halaman"
                                            className="py-0.5 px-2 text-xs rounded-md border-stone-300 bg-stone-50 font-semibold text-stone-700 focus:ring-brand-primary"
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                            <option value="ALL">Semua</option>
                                        </select>
                                    </div>
                                </div>

                                {!isAll && totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={safeCurrentPage === 1}
                                            aria-label="Halaman sebelumnya"
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                                                safeCurrentPage === 1
                                                    ? 'opacity-40 cursor-not-allowed bg-stone-100 text-stone-400 border-stone-200'
                                                    : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200 cursor-pointer'
                                            }`}
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Sebelumnya</span>
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {getPageNumbers(safeCurrentPage, totalPages).map((pageNum, idx) => {
                                                if (pageNum === '...') {
                                                    return (
                                                        <span key={`ellipsis-${idx}`} className="px-1 text-stone-400 font-bold select-none">
                                                            ...
                                                        </span>
                                                    );
                                                }

                                                const isActive = pageNum === safeCurrentPage;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        type="button"
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`min-w-7 h-7 px-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                            isActive
                                                                ? 'bg-brand-primary text-white shadow-xs'
                                                                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={safeCurrentPage === totalPages}
                                            aria-label="Halaman selanjutnya"
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                                                safeCurrentPage === totalPages
                                                    ? 'opacity-40 cursor-not-allowed bg-stone-100 text-stone-400 border-stone-200'
                                                    : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200 cursor-pointer'
                                            }`}
                                        >
                                            <span className="hidden sm:inline">Selanjutnya</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Detail: Selected Student Panel */}
                    <div className="bg-white border border-madrasah-border rounded-xl p-4 sm:p-5 shadow-2xs h-fit sticky top-24">
                        <div className="flex items-center justify-between pb-3 border-b border-madrasah-border">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-madrasah-muted">
                                Detail Verifikasi Presensi
                            </h2>
                            {selectedScan && (
                                <StatusBadge status={selectedScan.status} size="sm" />
                            )}
                        </div>

                        {selectedScan ? (
                            <div className="mt-4 space-y-4 text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-brand-primary text-white font-extrabold flex items-center justify-center text-base shadow-xs flex-shrink-0">
                                        {selectedScan.student_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-extrabold text-madrasah-fg truncate">
                                            {selectedScan.student_name}
                                        </h3>
                                        <p className="text-xs text-stone-500 font-mono">
                                            NISN: {selectedScan.nisn}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-3 border-t border-madrasah-border">
                                    <div className="flex justify-between py-1 border-b border-stone-100">
                                        <span className="text-madrasah-muted">Kelas / Tingkat:</span>
                                        <span className="font-bold text-stone-800">{selectedScan.class}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-stone-100">
                                        <span className="text-madrasah-muted">Waktu Pemindaian:</span>
                                        <span className="font-mono font-bold text-stone-800">{selectedScan.scanned_at} WIB</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-stone-100">
                                        <span className="text-madrasah-muted">Petugas Pemindai:</span>
                                        <span className="font-medium text-stone-800">{selectedScan.scanned_by || 'Petugas Piket'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-stone-100">
                                        <span className="text-madrasah-muted">Jadwal Shalat:</span>
                                        <span className="font-semibold text-brand-primary">Dzuhur Berjamaah</span>
                                    </div>
                                    {selectedScan.reject_reason && (
                                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 mt-2">
                                            <span className="font-bold">Catatan:</span> {selectedScan.reject_reason}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 space-y-2">
                                    {canEditAttendance && (
                                        <button
                                            type="button"
                                            onClick={() => openCorrectionModal(selectedScan)}
                                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white font-bold transition shadow-xs"
                                        >
                                            <SlidersHorizontal className="w-3.5 h-3.5" />
                                            <span>Koreksi / Ubah Status Siswa Ini</span>
                                        </button>
                                    )}

                                    <Link
                                        href={route('reports.monthly') + `?class=${selectedScan.class}`}
                                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-madrasah-border hover:bg-stone-50 text-stone-700 font-semibold transition"
                                    >
                                        <span>Lihat Riwayat Presensi Kelas Ini</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-brand-50/80 border border-brand-100 flex items-center justify-center text-brand-primary mb-3">
                                    <Users className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-stone-700">Pilih Siswa dari Tabel</p>
                                <p className="text-[11px] text-stone-500 mt-1 max-w-[210px]">
                                    Klik baris data pada tabel untuk memverifikasi atau mengoreksi status presensi siswa.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Detail & Koreksi Presensi */}
            {correctionModalOpen && targetScan && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-madrasah-border my-8 animate-in fade-in">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-brand-50 text-brand-primary">
                                    <SlidersHorizontal className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-madrasah-fg">
                                        Detail & Koreksi Presensi
                                    </h2>
                                    <p className="text-xs text-madrasah-muted">
                                        Ubah status presensi atau batalkan rekaman scan
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCorrectionModalOpen(false)}
                                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Student Info Card */}
                        <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-xs mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-stone-500">Nama Siswa:</span>
                                <span className="font-bold text-stone-900">{targetScan.student_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-stone-500">NISN / Kelas:</span>
                                <span className="font-mono font-semibold text-stone-800">{targetScan.nisn} ({targetScan.class})</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-stone-500">Waktu Scan Asli:</span>
                                <span className="font-mono text-stone-700">{targetScan.scanned_at} WIB</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-stone-500">Petugas Pemindai:</span>
                                <span className="text-stone-700 font-medium">{targetScan.scanned_by || 'Petugas Piket'}</span>
                            </div>
                        </div>

                        {/* Confirmation Area for Deleting Scan */}
                        {confirmDeleteOpen ? (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 mb-4 animate-in fade-in">
                                <div className="flex items-start gap-2.5">
                                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-xs font-bold text-rose-900">
                                            Yakin ingin membatalkan presensi siswa ini?
                                        </h3>
                                        <p className="text-[11px] text-rose-700 mt-1">
                                            Rekaman presensi hari ini untuk <b>{targetScan.student_name}</b> akan dihapus dari sistem dan status siswa kembali menjadi belum hadir (alpha).
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteOpen(false)}
                                        className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-white rounded-lg border border-stone-300"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isDeletingAttendance}
                                        onClick={handleDeleteAttendance}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5"
                                    >
                                        {isDeletingAttendance ? (
                                            <>
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                <span>Menghapus...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Ya, Batalkan Scan</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveCorrection} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-2">
                                        Pilih Status Presensi Baru:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <label
                                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                                correctionStatus === 'HADIR'
                                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-xs'
                                                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="status"
                                                value="HADIR"
                                                checked={correctionStatus === 'HADIR'}
                                                onChange={(e) => setCorrectionStatus(e.target.value)}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span>Hadir Tepat Waktu</span>
                                        </label>

                                        <label
                                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                                correctionStatus === 'TERLAMBAT'
                                                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs'
                                                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="status"
                                                value="TERLAMBAT"
                                                checked={correctionStatus === 'TERLAMBAT'}
                                                onChange={(e) => setCorrectionStatus(e.target.value)}
                                                className="text-amber-600 focus:ring-amber-500"
                                            />
                                            <span>Terlambat</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        Alasan / Catatan Koreksi (Opsional):
                                    </label>
                                    <textarea
                                        value={correctionReason}
                                        onChange={(e) => setCorrectionReason(e.target.value)}
                                        placeholder="Contoh: Siswa terlambat masuk barisan karena kendala wudhu..."
                                        rows={2}
                                        className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Batalkan Scan</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCorrectionModalOpen(false)}
                                            className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                                        >
                                            Tutup
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSavingCorrection}
                                            className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-secondary inline-flex items-center gap-1.5 shadow-xs transition"
                                        >
                                            {isSavingCorrection ? (
                                                <>
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Menyimpan...</span>
                                                </>
                                            ) : (
                                                <span>Simpan Koreksi</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
