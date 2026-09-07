import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileSpreadsheet,
    Printer,
    Search,
    Users,
    ShieldCheck
} from 'lucide-react';

export default function MonthlyReportIndex({
    auth,
    reportData = [],
    officerReportData = [],
    officerMeta = {},
    academicYears = [],
    classes = [],
    meta = {},
    activeTab: initialActiveTab = 'students'
}) {
    const classList = classes && classes.length > 0 ? classes : (meta.available_classes || meta.classes || [
        '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10',
        '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10',
        '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10',
        'VII-A', 'VII-B', 'VII-C', 'VIII-A', 'VIII-B', 'VIII-C', 'IX-A', 'IX-B', 'IX-C',
    ]);

    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(meta.academic_year_id?.toString() || '');
    const [selectedMonth, setSelectedMonth] = useState(meta.month?.toString() || '1');
    const [selectedYear, setSelectedYear] = useState(meta.year?.toString() || '2025');
    const [selectedClass, setSelectedClass] = useState(meta.class || 'ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [officerSearchQuery, setOfficerSearchQuery] = useState('');

    const months = [
        { id: '1', name: 'Januari' },
        { id: '2', name: 'Februari' },
        { id: '3', name: 'Maret' },
        { id: '4', name: 'April' },
        { id: '5', name: 'Mei' },
        { id: '6', name: 'Juni' },
        { id: '7', name: 'Juli' },
        { id: '8', name: 'Agustus' },
        { id: '9', name: 'September' },
        { id: '10', name: 'Oktober' },
        { id: '11', name: 'November' },
        { id: '12', name: 'Desember' },
    ];

    // Trigger dynamic backend filter
    const handleFilterChange = (yearId, month, year, grade) => {
        router.get(route('reports.monthly'), {
            academic_year_id: yearId,
            month: month,
            year: year,
            class: grade,
            tab: activeTab,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const onAcademicYearChange = (e) => {
        const val = e.target.value;
        setSelectedAcademicYear(val);
        handleFilterChange(val, selectedMonth, selectedYear, selectedClass);
    };

    const onMonthChange = (e) => {
        const val = e.target.value;
        setSelectedMonth(val);
        handleFilterChange(selectedAcademicYear, val, selectedYear, selectedClass);
    };

    const onYearChange = (e) => {
        const val = e.target.value;
        setSelectedYear(val);
        handleFilterChange(selectedAcademicYear, selectedMonth, val, selectedClass);
    };

    const onClassChange = (e) => {
        const val = e.target.value;
        setSelectedClass(val);
        handleFilterChange(selectedAcademicYear, selectedMonth, selectedYear, val);
    };

    // Filtered reports locally for text search
    const filteredReports = (reportData || []).filter((row) => {
        return (
            row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.nisn.includes(searchQuery)
        );
    });

    const filteredOfficerReports = (officerReportData || []).filter((row) => {
        const q = officerSearchQuery.toLowerCase();
        return (
            row.name.toLowerCase().includes(q) ||
            row.email.toLowerCase().includes(q) ||
            (row.assigned_classes && row.assigned_classes.toLowerCase().includes(q))
        );
    });

    const handleExportExcel = () => {
        let exportUrl = route('reports.monthly.export') + `?month=${selectedMonth}&year=${selectedYear}&class=${selectedClass}`;
        if (selectedAcademicYear) {
            exportUrl += `&academic_year_id=${selectedAcademicYear}`;
        }
        window.location.href = exportUrl;
    };

    const handleExportOfficerExcel = () => {
        let exportUrl = route('reports.monthly.officers.export') + `?month=${selectedMonth}&year=${selectedYear}`;
        if (selectedAcademicYear) {
            exportUrl += `&academic_year_id=${selectedAcademicYear}`;
        }
        window.location.href = exportUrl;
    };

    const handleExportPdf = () => {
        window.print();
    };

    const currentMonthName = months.find((m) => m.id === selectedMonth)?.name || 'Januari';
    const activeYearName = meta.academic_year_name || '2025/2026';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 no-print">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-madrasah-fg tracking-tight">
                            Laporan Rekapitulasi Presensi Bulanan
                        </h1>
                        <p className="text-xs text-madrasah-muted mt-0.5">
                            {activeTab === 'students'
                                ? `Evaluasi kehadiran Shalat Dzuhur per siswa dan per kelas di MTsN 3 Kota Padang • Tahun Ajaran ${activeYearName}`
                                : `Evaluasi jumlah siswa yang discan oleh setiap petugas piket (Senin–Kamis) di MTsN 3 Kota Padang • Tahun Ajaran ${activeYearName}`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={activeTab === 'students' ? handleExportExcel : handleExportOfficerExcel}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>
                                {activeTab === 'students' ? 'Ekspor Excel Siswa' : 'Ekspor Excel Petugas'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportPdf}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold shadow-xs transition"
                        >
                            <Printer className="w-4 h-4 text-brand-accent" />
                            <span>Cetak Laporan</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Laporan Bulanan (${activeTab === 'students' ? 'Siswa' : 'Petugas Piket'}) - I-FLOW`} />

            <div className="space-y-6">
                {/* Print Header */}
                <div className="hidden print:block text-center border-b-2 border-stone-900 pb-3 mb-4">
                    <h1 className="text-lg font-black uppercase">
                        {activeTab === 'students'
                            ? 'REKAPITULASI PRESENSI SHALAT DZUHUR SISWA'
                            : 'REKAPITULASI KINERJA PEMINDAIAN PETUGAS PIKET SHALAT DZUHUR'}
                    </h1>
                    <p className="text-xs font-bold">
                        MTsN 3 KOTA PADANG — TAHUN AJARAN {activeYearName} — PERIODE: {currentMonthName.toUpperCase()} {selectedYear}
                    </p>
                    {activeTab === 'students' && selectedClass !== 'ALL' && (
                        <p className="text-xs font-medium">KELAS: {selectedClass}</p>
                    )}
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-2 border-b border-madrasah-border pb-2 no-print">
                    <button
                        type="button"
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                            activeTab === 'students'
                                ? 'bg-brand-primary text-white shadow-xs'
                                : 'text-madrasah-muted hover:text-madrasah-fg hover:bg-stone-100'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Rekap Presensi Siswa</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                            {reportData.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('officers')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                            activeTab === 'officers'
                                ? 'bg-brand-primary text-white shadow-xs'
                                : 'text-madrasah-muted hover:text-madrasah-fg hover:bg-stone-100'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Rekap Kinerja Petugas Piket</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            activeTab === 'officers' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                            {officerReportData.length}
                        </span>
                    </button>
                </div>

                {/* Filter Toolbar (Hidden in Print) */}
                <div className="bg-white border border-madrasah-border rounded-xl p-4 shadow-2xs no-print">
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeTab === 'students' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
                        <div>
                            <label className="block text-[10px] font-bold text-madrasah-muted uppercase mb-1">
                                Tahun Ajaran
                            </label>
                            <select
                                value={selectedAcademicYear}
                                onChange={onAcademicYearChange}
                                className="w-full py-1.5 px-3 text-xs rounded-lg border-madrasah-border bg-stone-50 font-bold text-brand-primary"
                            >
                                {academicYears.map((ay) => (
                                    <option key={ay.id} value={ay.id}>
                                        {ay.name} {ay.is_active ? '(Aktif)' : '(Arsip)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-madrasah-muted uppercase mb-1">
                                Bulan
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={onMonthChange}
                                className="w-full py-1.5 px-3 text-xs rounded-lg border-madrasah-border bg-stone-50 font-semibold"
                            >
                                {months.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-madrasah-muted uppercase mb-1">
                                Tahun Kalender
                            </label>
                            <select
                                value={selectedYear}
                                onChange={onYearChange}
                                className="w-full py-1.5 px-3 text-xs rounded-lg border-madrasah-border bg-stone-50 font-semibold"
                            >
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                            </select>
                        </div>

                        {activeTab === 'students' && (
                            <div>
                                <label className="block text-[10px] font-bold text-madrasah-muted uppercase mb-1">
                                    Kelas
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={onClassChange}
                                    aria-label="Pilih Kelas"
                                    className="w-full py-1.5 px-3 text-xs rounded-lg border-madrasah-border bg-stone-50 font-semibold"
                                >
                                    <option value="ALL">Semua Kelas</option>
                                    {classList.map((cls) => (
                                        <option key={cls} value={cls}>Kelas {cls}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-bold text-madrasah-muted uppercase mb-1">
                                {activeTab === 'students' ? 'Cari Siswa / NISN' : 'Cari Nama / Email Petugas'}
                            </label>
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="text"
                                    value={activeTab === 'students' ? searchQuery : officerSearchQuery}
                                    onChange={(e) => activeTab === 'students' ? setSearchQuery(e.target.value) : setOfficerSearchQuery(e.target.value)}
                                    placeholder={activeTab === 'students' ? 'Ketik nama atau NISN...' : 'Ketik nama atau email...'}
                                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border-madrasah-border focus:ring-brand-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Banner */}
                {activeTab === 'students' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Hari Efektif Sekolah (Senin–Kamis)</div>
                            <div className="font-mono text-xl font-extrabold text-brand-primary mt-1">
                                {meta.effective_days || 18} <span className="text-xs font-sans font-normal text-stone-500">Hari</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Total Siswa Terdaftar</div>
                            <div className="font-mono text-xl font-extrabold text-stone-800 mt-1">
                                {meta.total_students || reportData.length} <span className="text-xs font-sans font-normal text-stone-500">Siswa</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Rata-rata Disiplin</div>
                            <div className="font-mono text-xl font-extrabold text-emerald-700 mt-1">
                                {meta.avg_percentage || 0}%
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Kategori Kehadiran</div>
                            <div className="text-xs font-bold text-brand-primary mt-1">
                                {meta.avg_percentage >= 90 ? 'Sangat Baik (A)' : meta.avg_percentage >= 75 ? 'Baik (B)' : 'Perlu Bimbingan'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Hari Efektif (Senin–Kamis)</div>
                            <div className="font-mono text-xl font-extrabold text-brand-primary mt-1">
                                {meta.effective_days || 18} <span className="text-xs font-sans font-normal text-stone-500">Hari</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Total Petugas</div>
                            <div className="font-mono text-xl font-extrabold text-stone-800 mt-1">
                                {officerMeta?.total_officers ?? officerReportData.length} <span className="text-xs font-sans font-normal text-stone-500">Orang</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Total Siswa Discan</div>
                            <div className="font-mono text-xl font-extrabold text-emerald-700 mt-1">
                                {officerMeta?.total_scans ?? 0} <span className="text-xs font-sans font-normal text-stone-500">Scan</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Rata-rata / Petugas</div>
                            <div className="font-mono text-xl font-extrabold text-stone-800 mt-1">
                                {officerMeta?.avg_scans_per_officer ?? 0} <span className="text-xs font-sans font-normal text-stone-500">Siswa</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-madrasah-border shadow-2xs col-span-2 sm:col-span-1">
                            <div className="text-[10px] font-bold text-madrasah-muted uppercase">Petugas Teraktif</div>
                            <div className="text-xs font-bold text-brand-primary mt-1 truncate" title={officerMeta?.most_active_officer || '-'}>
                                {officerMeta?.most_active_officer || '-'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Comparative Report Table */}
                {activeTab === 'students' ? (
                    <div className="bg-white border border-madrasah-border rounded-xl shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-stone-50 border-b border-madrasah-border text-madrasah-muted uppercase font-bold text-[10px] tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4 w-10">No</th>
                                        <th className="py-3 px-4">NISN</th>
                                        <th className="py-3 px-4">Nama Lengkap Siswa</th>
                                        <th className="py-3 px-4">Kelas</th>
                                        <th className="py-3 px-4 text-center">Hadir (Tepat)</th>
                                        <th className="py-3 px-4 text-center">Terlambat</th>
                                        <th className="py-3 px-4 text-center">Alpha / Izin</th>
                                        <th className="py-3 px-4 text-right">Persentase</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-madrasah-border/60">
                                    {filteredReports.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-madrasah-muted">
                                                Tidak ada data laporan yang cocok dengan filter yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredReports.map((row, index) => {
                                            return (
                                                <tr key={row.nisn} className="hover:bg-stone-50 transition">
                                                    <td className="py-2.5 px-4 font-mono text-stone-500">{index + 1}</td>
                                                    <td className="py-2.5 px-4 font-mono font-bold text-stone-700">{row.nisn}</td>
                                                    <td className="py-2.5 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-madrasah-fg">{row.name}</span>
                                                            {row.is_archived && (
                                                                <span className="text-[9px] font-semibold bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                                                                    Arsip
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4 font-semibold text-brand-primary">{row.class}</td>
                                                    <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                                                        {row.total_hadir}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-700">
                                                        {row.total_terlambat}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-700">
                                                        {row.total_alpha}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right">
                                                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                                                            row.percentage >= 90
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : row.percentage >= 75
                                                                ? 'bg-amber-100 text-amber-900'
                                                                : 'bg-rose-100 text-rose-900'
                                                        }`}>
                                                            {row.percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-stone-50 px-4 py-3 border-t border-madrasah-border flex flex-col sm:flex-row items-center justify-between text-xs text-madrasah-muted gap-2">
                            <span>Menampilkan {filteredReports.length} dari {reportData.length} siswa pada Tahun Ajaran {activeYearName}</span>
                            <span className="text-[11px] font-medium">
                                * Persentase dihitung dari: (Total Hadir + Terlambat) / {meta.effective_days || 18} Hari Efektif (Senin–Kamis)
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-madrasah-border rounded-xl shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-stone-50 border-b border-madrasah-border text-madrasah-muted uppercase font-bold text-[10px] tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4 w-10">No</th>
                                        <th className="py-3 px-4">Nama Petugas</th>
                                        <th className="py-3 px-4">Peran</th>
                                        <th className="py-3 px-4">Kelas Penugasan</th>
                                        <th className="py-3 px-4 text-center">Hari Aktif</th>
                                        <th className="py-3 px-4 text-center">Hadir (Tepat)</th>
                                        <th className="py-3 px-4 text-center">Terlambat</th>
                                        <th className="py-3 px-4 text-center">Total Siswa Discan</th>
                                        <th className="py-3 px-4 text-right">Rata-rata / Hari</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-madrasah-border/60">
                                    {filteredOfficerReports.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="py-8 text-center text-madrasah-muted">
                                                Tidak ada data pemindaian petugas yang cocok dengan filter yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOfficerReports.map((officer, index) => {
                                            return (
                                                <tr key={officer.user_id} className="hover:bg-stone-50 transition">
                                                    <td className="py-2.5 px-4 font-mono text-stone-500">{index + 1}</td>
                                                    <td className="py-2.5 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-madrasah-fg">{officer.name}</span>
                                                            <span className="text-[11px] text-madrasah-muted font-mono">{officer.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            officer.role === 'ADMIN'
                                                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        }`}>
                                                            {officer.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <span className="inline-block text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 max-w-[200px] truncate" title={officer.assigned_classes}>
                                                            {officer.assigned_classes}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center font-mono font-bold text-stone-700">
                                                        {officer.active_days} <span className="text-[10px] font-sans text-stone-400 font-normal">hari</span>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                                                        {officer.total_hadir}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-700">
                                                        {officer.total_terlambat}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <span className="font-mono font-extrabold text-brand-primary text-sm px-2.5 py-0.5 bg-stone-100 rounded-md border border-stone-200">
                                                            {officer.total_scans}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right font-mono font-bold text-stone-800">
                                                        {officer.avg_per_day} <span className="text-[10px] font-sans text-stone-400 font-normal">/hari</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-stone-50 px-4 py-3 border-t border-madrasah-border flex flex-col sm:flex-row items-center justify-between text-xs text-madrasah-muted gap-2">
                            <span>Menampilkan {filteredOfficerReports.length} dari {officerReportData.length} petugas pada Periode {currentMonthName} {selectedYear}</span>
                            <span className="text-[11px] font-medium">
                                * Penghitungan mencakup seluruh pemindaian presensi shalat dzuhur pada hari aktif (Senin–Kamis).
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
