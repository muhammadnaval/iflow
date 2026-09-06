import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MadrasahLogo from '@/Components/MadrasahLogo';
import QRCode from 'qrcode';
import {
    Printer,
    Search,
    CheckSquare,
    Square,
    Sparkles,
    AlertCircle,
    RotateCcw
} from 'lucide-react';

function StudentQrCode({ nisn }) {
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        let isMounted = true;
        // Generate pure 10-digit NISN payload for cleaner matrix and universal card compatibility
        const payload = nisn;
        QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 140,
            color: {
                dark: '#111827',
                light: '#ffffff',
            },
        }).then((url) => {
            if (isMounted) setQrUrl(url);
        }).catch((err) => {
            console.error(err);
        });

        return () => {
            isMounted = false;
        };
    }, [nisn]);

    if (!qrUrl) {
        return (
            <div className="w-20 h-20 bg-stone-100 animate-pulse rounded-lg border border-stone-200 flex items-center justify-center text-[10px] text-stone-400 font-mono">
                QR...
            </div>
        );
    }

    return (
        <img
            src={qrUrl}
            alt={`QR Code ${nisn}`}
            className="w-20 h-20 object-contain rounded border border-stone-300 p-0.5 bg-white"
        />
    );
}

export default function QrCardsIndex({ auth, students = [], academicYear = '2025/2026' }) {
    const [selectedClass, setSelectedClass] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState(students.map((s) => s.id));

    // Filter students based on class and search
    const filteredStudents = students.filter((student) => {
        const matchesClass = selectedClass === 'ALL' || student.grade === selectedClass;
        const matchesSearch =
            student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.nisn.includes(searchQuery);
        return matchesClass && matchesSearch;
    });

    const toggleSelectAllFiltered = () => {
        const filteredIds = filteredStudents.map((s) => s.id);
        const allFilteredSelected = filteredIds.every((id) => selectedIds.includes(id));

        if (allFilteredSelected) {
            setSelectedIds(selectedIds.filter((id) => !filteredIds.includes(id)));
        } else {
            const newSet = new Set([...selectedIds, ...filteredIds]);
            setSelectedIds(Array.from(newSet));
        }
    };

    const toggleStudent = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((i) => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handlePrint = () => {
        if (selectedIds.length === 0) {
            alert('Pilih minimal 1 kartu siswa untuk dicetak.');
            return;
        }
        window.print();
    };

    // Calculate how many A4 sheets (8 cards per sheet)
    const totalSheets = Math.ceil(selectedIds.length / 8);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 no-print">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-madrasah-fg tracking-tight">
                            Generate & Cetak Kartu QR Siswa
                        </h1>
                        <p className="text-xs text-madrasah-muted mt-0.5">
                            Cetak massal kartu presensi QR Code (A4 Landscape — 8 kartu per lembar) • Tahun Ajaran {academicYear}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={selectedIds.length === 0}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-stone-950 text-xs font-black shadow-sm transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer className="w-4 h-4" />
                            <span>
                                Cetak {selectedIds.length} Kartu Terpilih ({totalSheets} Lembar A4)
                            </span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Cetak Kartu QR Siswa - I-FLOW" />

            {/* Filter & Selection Bar (Hidden in Print) */}
            <div className="bg-white border border-madrasah-border rounded-xl p-4 shadow-2xs space-y-3 no-print mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama atau NISN siswa..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border-madrasah-border focus:ring-brand-primary focus:border-brand-primary"
                            />
                        </div>

                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="py-1.5 px-3 text-xs rounded-lg border-madrasah-border bg-stone-50 focus:ring-brand-primary focus:border-brand-primary font-semibold"
                        >
                            <option value="ALL">Semua Kelas</option>
                            <option value="VII-A">VII-A</option>
                            <option value="VII-B">VII-B</option>
                            <option value="VII-C">VII-C</option>
                            <option value="VIII-A">VIII-A</option>
                            <option value="VIII-B">VIII-B</option>
                            <option value="VIII-C">VIII-C</option>
                            <option value="IX-A">IX-A</option>
                            <option value="IX-B">IX-B</option>
                            <option value="IX-C">IX-C</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={toggleSelectAllFiltered}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-brand-primary bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 transition"
                        >
                            {filteredStudents.every((s) => selectedIds.includes(s.id)) ? (
                                <>
                                    <CheckSquare className="w-4 h-4 text-brand-primary" />
                                    <span>Batalkan Pilihan Filter ({filteredStudents.length})</span>
                                </>
                            ) : (
                                <>
                                    <Square className="w-4 h-4 text-stone-400" />
                                    <span>Pilih Semua di Filter ({filteredStudents.length})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="text-[11px] text-stone-500 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-primary">Format Payload:</span>
                        <code className="bg-stone-100 px-1.5 py-0.5 rounded font-mono text-stone-800 font-bold">
                            &lt;NISN&gt; (10 Digit Angka)
                        </code>
                        <span className="hidden sm:inline text-stone-500">(Kompatibel dengan Kartu Pelajar Nasional & format legacy I-FLOW: / DZUHURSCAN:)</span>
                    </div>

                    <div className="font-semibold text-stone-700">
                        Terpilih: <b className="text-brand-primary font-mono">{selectedIds.length}</b> dari {students.length} Siswa
                    </div>
                </div>
            </div>

            {/* Print Header (Only visible on paper print) */}
            <div className="hidden print:block mb-4 text-center border-b-2 border-stone-800 pb-2">
                <h1 className="text-base font-extrabold uppercase tracking-tight">
                    KARTU PRESENSI SHALAT DZUHUR BERJAMAAH
                </h1>
                <p className="text-xs font-bold text-stone-700">
                    MADRASAH TSANAWIYAH NEGERI (MTsN) 3 KOTA PADANG — TAHUN AJARAN {academicYear}
                </p>
            </div>

            {/* Cards Grid: Screen grid vs Print 4-column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 qr-card-print-grid">
                {filteredStudents.map((student) => {
                    const isSelected = selectedIds.includes(student.id);

                    return (
                        <div
                            key={student.id}
                            onClick={() => toggleStudent(student.id)}
                            className={`relative bg-white border-2 rounded-2xl p-4 shadow-2xs transition cursor-pointer select-none qr-card-item ${
                                isSelected
                                    ? 'border-brand-primary'
                                    : 'border-dashed border-stone-300 opacity-50 bg-stone-50/50 print:hidden'
                            }`}
                            style={{ minHeight: '190px' }}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <MadrasahLogo className="w-6 h-6" />
                                    <div className="leading-tight">
                                        <div className="font-extrabold text-[10px] text-brand-primary uppercase">
                                            MTsN 3 Kota Padang
                                        </div>
                                        <div className="text-[8px] text-stone-500 font-medium">
                                            Kartu Presensi Dzuhur
                                        </div>
                                    </div>
                                </div>

                                <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                                    {student.grade}
                                </span>
                            </div>

                            {/* Card Body: Real QR Code + Student Info */}
                            <div className="flex items-center gap-3">
                                <StudentQrCode nisn={student.nisn} />

                                <div className="min-w-0 flex-1">
                                    <div className="font-extrabold text-xs text-madrasah-fg line-clamp-2 leading-tight">
                                        {student.full_name}
                                    </div>
                                    <div className="mt-1 font-mono text-[11px] font-black text-brand-primary">
                                        {student.nisn}
                                    </div>
                                    <div className="text-[10px] text-stone-500 mt-0.5">
                                        JK: {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-2.5 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[8px] text-stone-400 font-mono">
                                <span>TA {academicYear}</span>
                                <span className="font-bold text-brand-primary">VERIFIED QR</span>
                            </div>

                            {/* Selection Checkbox Indicator (Hidden in print) */}
                            <div className="absolute top-2.5 right-2.5 no-print">
                                {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-brand-primary" />
                                ) : (
                                    <Square className="w-4 h-4 text-stone-300" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </AuthenticatedLayout>
    );
}
