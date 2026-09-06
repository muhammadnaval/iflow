import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import {
    FileSpreadsheet,
    UploadCloud,
    Download,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ArrowRight,
    ArrowLeft,
    RefreshCw,
    Archive,
    Sparkles
} from 'lucide-react';

export default function ImportIndex({ auth, activeYear }) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Validation, 3: Confirmation & Archive, 4: Success
    const [selectedFile, setSelectedFile] = useState(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // Upload and validate real file via Backend API
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setIsParsing(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(route('admin.students.import.validate'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setParsedData(response.data);
            setStep(2);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.file?.[0] || 'Gagal memproses berkas Excel.';
            setErrorMessage(msg);
        } finally {
            setIsParsing(false);
        }
    };

    // Download official blank template
    const handleDownloadTemplate = () => {
        window.location.href = route('admin.students.import.template');
    };

    // Confirm & Execute real database import transaction
    const handleConfirmImport = async () => {
        if (!parsedData || !parsedData.valid_data) return;

        setIsParsing(true);
        try {
            const response = await axios.post(route('admin.students.import.store'), {
                valid_data: parsedData.valid_data,
                academic_year_id: activeYear?.id,
            });

            if (response.data?.success) {
                setStep(4);
            } else {
                alert(response.data?.message || 'Gagal mengimpor data.');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data ke database.');
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-madrasah-fg tracking-tight">
                        Import Data Siswa Massal
                    </h1>
                    <p className="text-xs text-madrasah-muted mt-0.5">
                        Unggah data siswa kelas VII, VIII, dan IX via template Excel untuk Tahun Ajaran {activeYear?.name || '2025/2026'}
                    </p>
                </div>
            }
        >
            <Head title="Import Data Siswa - I-FLOW" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* 3-Step Wizard Progress Bar */}
                <div className="bg-white border border-madrasah-border rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                step >= 1 ? 'bg-brand-primary text-white' : 'bg-stone-100 text-stone-500'
                            }`}>
                                1
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-xs font-bold text-madrasah-fg">Unggah Berkas</div>
                                <div className="text-[11px] text-madrasah-muted">Template .xlsx</div>
                            </div>
                        </div>

                        <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-brand-primary' : 'bg-stone-200'}`}></div>

                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                step >= 2 ? 'bg-brand-primary text-white' : 'bg-stone-100 text-stone-500'
                            }`}>
                                2
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-xs font-bold text-madrasah-fg">Validasi Data</div>
                                <div className="text-[11px] text-madrasah-muted">Pengecekan Baris</div>
                            </div>
                        </div>

                        <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-brand-primary' : 'bg-stone-200'}`}></div>

                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                step >= 3 ? 'bg-brand-primary text-white' : 'bg-stone-100 text-stone-500'
                            }`}>
                                3
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-xs font-bold text-madrasah-fg">Arsip & Konfirmasi</div>
                                <div className="text-[11px] text-madrasah-muted">Simpan ke MySQL</div>
                            </div>
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Step 1: Upload Dropzone */}
                {step === 1 && (
                    <div className="bg-white border border-madrasah-border rounded-xl p-6 shadow-2xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-brand-50 border border-brand-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-brand-primary text-brand-accent flex-shrink-0">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-brand-primary">
                                        Template Resmi Excel Siswa MTsN 3 Kota Padang
                                    </h2>
                                    <p className="text-xs text-stone-600">
                                        Unduh format resmi kolom: NISN, NAMA_LENGKAP, KELAS, JENIS_KELAMIN.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-stone-50 text-brand-primary border border-brand-300 text-xs font-bold shadow-2xs flex-shrink-0"
                            >
                                <Download className="w-4 h-4" />
                                <span>Unduh Template .xlsx</span>
                            </button>
                        </div>

                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-madrasah-border hover:border-brand-primary rounded-2xl p-8 text-center transition bg-stone-50/50">
                            <UploadCloud className="w-12 h-12 text-brand-primary/60 mx-auto mb-3" />
                            <h2 className="text-sm font-bold text-madrasah-fg">
                                {isParsing ? 'Memproses dan memvalidasi berkas...' : 'Pilih Berkas Excel (.xlsx)'}
                            </h2>
                            <p className="text-xs text-madrasah-muted mt-1">
                                Format: .xlsx / .xls (Maksimal 5 MB / 2.000 baris)
                            </p>

                            <div className="mt-5 flex justify-center gap-3">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-stone-950 font-bold text-xs shadow-xs">
                                    <span>{isParsing ? 'Menganalisis...' : 'Unggah File Excel'}</span>
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        className="hidden"
                                        disabled={isParsing}
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Validation & Preview */}
                {step === 2 && parsedData && (
                    <div className="bg-white border border-madrasah-border rounded-xl p-6 shadow-2xs space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-madrasah-border">
                            <div>
                                <h2 className="text-base font-bold text-madrasah-fg">
                                    Hasil Validasi Berkas: {selectedFile?.name || 'File Excel'}
                                </h2>
                                <p className="text-xs text-madrasah-muted">
                                    Tahun Ajaran Target: <b className="text-brand-primary">{activeYear?.name || '2025/2026'}</b>
                                </p>
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Ganti Berkas
                            </button>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                                <div className="text-xs text-madrasah-muted font-medium">Total Baris Terbaca</div>
                                <div className="font-mono text-2xl font-black text-madrasah-fg mt-1">
                                    {parsedData.total_rows}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                <div className="text-xs text-emerald-800 font-medium">Baris Valid</div>
                                <div className="font-mono text-2xl font-black text-emerald-700 mt-1">
                                    {parsedData.valid_rows}
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border ${
                                parsedData.error_rows > 0 ? 'bg-rose-50 border-rose-200' : 'bg-stone-50 border-stone-200'
                            }`}>
                                <div className={`text-xs font-medium ${parsedData.error_rows > 0 ? 'text-rose-800' : 'text-madrasah-muted'}`}>
                                    Baris Bermasalah
                                </div>
                                <div className={`font-mono text-2xl font-black mt-1 ${parsedData.error_rows > 0 ? 'text-rose-700' : 'text-stone-400'}`}>
                                    {parsedData.error_rows}
                                </div>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {parsedData.error_rows > 0 ? (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-3">
                                <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                                    <span>Terdapat {parsedData.error_rows} baris tidak valid (All-or-Nothing Rule)</span>
                                </div>
                                <p className="text-xs text-rose-800">
                                    Seluruh proses dibatalkan sampai seluruh data dalam file diperbaiki.
                                </p>

                                <div className="bg-white rounded-lg border border-rose-200 p-3 space-y-2">
                                    <div className="text-[11px] font-bold text-rose-900 uppercase">Daftar Baris Error:</div>
                                    {parsedData.errors.map((err, i) => (
                                        <div key={i} className="text-xs flex items-start gap-2 text-stone-800">
                                            <span className="font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px]">
                                                Baris {err.row}
                                            </span>
                                            <span>NISN <b className="font-mono">{err.nisn}</b> ({err.name}): <span className="text-rose-700 font-medium">{err.reason}</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                                <div className="text-xs text-emerald-900">
                                    <b>Semua baris lolos verifikasi format!</b> {parsedData.valid_rows} siswa kelas VII, VIII, dan IX siap diimpor ke database.
                                </div>
                            </div>
                        )}

                        {/* Step 2 Actions */}
                        <div className="flex justify-between items-center pt-3 border-t border-madrasah-border">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 rounded-lg border border-madrasah-border text-stone-700 hover:bg-stone-50 text-xs font-bold"
                            >
                                Kembali
                            </button>

                            <button
                                type="button"
                                disabled={parsedData.error_rows > 0 || isParsing}
                                onClick={() => setStep(3)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-stone-950 font-extrabold text-xs shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span>Lanjutkan ke Tahap Arsip & Konfirmasi</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Archive & Confirmation */}
                {step === 3 && (
                    <div className="bg-white border border-madrasah-border rounded-xl p-6 shadow-2xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-madrasah-border">
                            <div className="p-3 rounded-xl bg-amber-100 text-amber-900">
                                <Archive className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-madrasah-fg">
                                    Skema Pengarsipan Tahun Ajaran (FR-02)
                                </h2>
                                <p className="text-xs text-madrasah-muted">
                                    Data siswa baru akan dihubungkan ke Tahun Ajaran {activeYear?.name || '2025/2026'}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-3">
                            <div className="font-bold text-stone-900">
                                Ringkasan Transaksi Database:
                            </div>
                            <ul className="space-y-2 text-stone-700">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                                    <span>Tahun Ajaran Aktif: <b className="text-brand-primary">{activeYear?.name || '2025/2026'}</b></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                                    <span>{parsedData?.valid_rows} siswa akan didaftarkan/diperbarui di tabel <code>students</code> MySQL.</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                                    <span>Histori presensi masa lalu tetap aman untuk pelaporan rekapitulasi.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-madrasah-border">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="px-4 py-2 rounded-lg border border-madrasah-border text-stone-700 hover:bg-stone-50 text-xs font-bold"
                            >
                                Kembali ke Validasi
                            </button>

                            <button
                                type="button"
                                disabled={isParsing}
                                onClick={handleConfirmImport}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-extrabold text-xs shadow-sm transition active:scale-98"
                            >
                                <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                                <span>{isParsing ? 'Menyimpan ke MySQL...' : 'Simpan Data ke Database'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success Completion */}
                {step === 4 && (
                    <div className="bg-white border border-madrasah-border rounded-xl p-8 shadow-2xs text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-extrabold text-madrasah-fg">
                            Import Data Siswa Berhasil!
                        </h2>
                        <p className="text-xs text-stone-600 max-w-md mx-auto">
                            Sebanyak <b>{parsedData?.valid_rows || 0} data siswa</b> telah berhasil disimpan di database MySQL. Kartu QR siswa kini siap di-generate dan dicetak.
                        </p>

                        <div className="pt-4 flex justify-center gap-3">
                            <Link
                                href={route('admin.students.qr-cards')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-stone-950 font-extrabold text-xs shadow-sm transition"
                            >
                                <span>Cetak Kartu QR Siswa Sekarang</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-madrasah-border hover:bg-stone-50 text-stone-700 font-bold text-xs"
                            >
                                Kembali ke Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
