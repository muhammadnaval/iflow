import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import ScannerLayout from '@/Layouts/ScannerLayout';
import StatusBadge from '@/Components/UI/StatusBadge';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import {
    Camera,
    Search,
    RefreshCw,
    Volume2,
    VolumeX,
    CheckCircle2,
    Clock,
    AlertTriangle,
    XCircle,
    User
} from 'lucide-react';

export default function ScanIndex({ auth, students = [], presenceWindow }) {
    const [scannerActive, setScannerActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [lastResult, setLastResult] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Manual Search Modal State
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [manualNisn, setManualNisn] = useState('');
    const [manualSearchResult, setManualSearchResult] = useState(null);

    const html5QrCodeRef = useRef(null);
    const isProcessingRef = useRef(false);

    // Audio Feedback Synthesizer
    const playAudioFeedback = (type) => {
        if (!soundEnabled || typeof window === 'undefined') return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'HADIR') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'TERLAMBAT') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(370, now + 0.15);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'DUPLICATE') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.setValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.25);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(140, now + 0.25);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.warn('Audio context error', e);
        }
    };

    // Haptic feedback
    const triggerHaptic = (type) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            if (type === 'HADIR') navigator.vibrate(100);
            else if (type === 'TERLAMBAT') navigator.vibrate([70, 50, 70]);
            else if (type === 'DUPLICATE') navigator.vibrate([40, 40, 40, 40]);
            else navigator.vibrate([200, 100, 200]);
        }
    };

    // Send scan payload to Backend API
    const handleProcessCode = async (rawPayload) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        setIsSubmitting(true);

        // Strip I-FLOW or legacy prefix if present, otherwise accept clean 10-digit NISN
        const cleanNisn = rawPayload.replace(/^(I-FLOW|DZUHURSCAN):/i, '').trim();

        try {
            const response = await axios.post(route('scan.store'), {
                nisn: cleanNisn,
            });

            const resData = response.data;
            playAudioFeedback(resData.status);
            triggerHaptic(resData.status);
            setLastResult(resData);

            if (resData.data?.student) {
                setRecentScans((prev) => [
                    {
                        id: Date.now(),
                        student_name: resData.data.student.full_name,
                        nisn: resData.data.student.nisn,
                        class: resData.data.student.grade,
                        status: resData.status,
                        scanned_at: resData.data.scanned_at,
                    },
                    ...prev.slice(0, 9),
                ]);
            }
        } catch (error) {
            const errData = error.response?.data || {};
            const status = errData.status || 'REJECTED';
            playAudioFeedback(status);
            triggerHaptic(status);

            setLastResult({
                success: false,
                status: status,
                message: errData.message || 'Terjadi kesalahan saat mencatat presensi.',
                student: errData.data?.student || null,
                scanned_at: errData.data?.scanned_at || new Date().toLocaleTimeString('id-ID'),
            });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                isProcessingRef.current = false;
            }, 1200);
        }
    };

    // Camera Lifecycle
    const startCamera = async () => {
        setCameraError(null);
        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    handleProcessCode(decodedText);
                },
                () => {}
            );
            setScannerActive(true);
        } catch (err) {
            console.warn("Camera access failed", err);
            setCameraError("Kamera tidak dapat diakses atau izin belum diberikan. Gunakan fitur simulator atau pencarian manual di bawah.");
            setScannerActive(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (e) {
                console.error(e);
            }
        }
        setScannerActive(false);
    };

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    // Manual NISN search handler
    const handleManualLookup = (e) => {
        e.preventDefault();
        const term = manualNisn.trim().toLowerCase();
        const found = students.find((s) => s.nisn === term || s.full_name.toLowerCase().includes(term));
        setManualSearchResult(found || 'NOT_FOUND');
    };

    const confirmManualAttendance = () => {
        if (manualSearchResult && manualSearchResult !== 'NOT_FOUND') {
            handleProcessCode(manualSearchResult.nisn);
            setManualModalOpen(false);
            setManualNisn('');
            setManualSearchResult(null);
        }
    };

    const timeWindowDisplay = presenceWindow
        ? `${presenceWindow.start_time.substring(0, 5)} – ${presenceWindow.end_time.substring(0, 5)} WIB`
        : "11.45 – 12.30 WIB";

    return (
        <ScannerLayout activeTimeWindow={timeWindowDisplay}>
            <Head title="Scan Presensi QR - I-FLOW" />

            <div className="flex flex-col h-full space-y-4">
                {/* Top Status & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-stone-900/80 px-3.5 py-2.5 rounded-xl border border-stone-800 text-xs gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-stone-400">Petugas:</span>
                        <span className="font-semibold text-stone-200">
                            {auth?.user?.name || 'Petugas Piket'}
                        </span>
                        {auth?.user?.role === 'ADMIN' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-750 font-mono">
                                Semua Kelas (Admin)
                            </span>
                        ) : auth?.user?.assigned_classes && auth.user.assigned_classes.length > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700 font-mono">
                                Tugas: {auth.user.assigned_classes.join(', ')}
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-mono">
                                Tugas: Semua Kelas
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-1.5 rounded-lg border transition ${
                                soundEnabled ? 'bg-stone-800 text-amber-400 border-stone-700' : 'bg-stone-800 text-stone-500 border-stone-700'
                            }`}
                            title={soundEnabled ? 'Suara Aktif' : 'Suara Senyap'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Center: QR Camera Viewport */}
                <div className="relative flex-1 min-h-[300px] max-h-[420px] bg-black rounded-2xl overflow-hidden border-2 border-stone-800 flex items-center justify-center shadow-inner">
                    <div id="qr-reader" className="w-full h-full object-cover"></div>

                    {/* Laser Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                        <div className="relative w-60 h-60 border-2 border-brand-accent/80 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(249,168,37,0.3)]">
                            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-400"></div>
                            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-amber-400"></div>
                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-amber-400"></div>
                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-400"></div>

                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_10px_#f9a825] animate-pulse"></div>
                        </div>

                        <p className="mt-4 text-xs font-semibold text-stone-300 bg-stone-900/80 px-3 py-1 rounded-full border border-stone-700 backdrop-blur-xs">
                            Arahkan kartu QR siswa ke dalam bingkai
                        </p>
                    </div>

                    {cameraError && (
                        <div className="absolute inset-0 bg-stone-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
                            <Camera className="w-10 h-10 text-stone-600 mb-2" />
                            <p className="text-xs text-stone-300 max-w-xs">{cameraError}</p>
                            <button
                                onClick={startCamera}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 text-xs font-medium border border-stone-700"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Coba Nyalakan Ulang
                            </button>
                        </div>
                    )}
                </div>

                {/* Instant Feedback Result Banner */}
                {lastResult && (
                    <div
                        className={`p-4 rounded-xl border transition-all duration-200 animate-in fade-in zoom-in-95 ${
                            lastResult.status === 'HADIR'
                                ? 'bg-emerald-950/90 border-emerald-500 text-white'
                                : lastResult.status === 'TERLAMBAT'
                                ? 'bg-amber-950/90 border-amber-500 text-white'
                                : lastResult.status === 'DUPLICATE'
                                ? 'bg-orange-950/90 border-orange-500 text-white'
                                : 'bg-rose-950/90 border-rose-500 text-white'
                        }`}
                        role="status"
                        aria-live="polite"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <StatusBadge status={lastResult.status} size="sm" />
                                    <span className="font-mono text-xs text-stone-300">
                                        {lastResult.data?.scanned_at || lastResult.scanned_at}
                                    </span>
                                </div>
                                {lastResult.data?.student || lastResult.student ? (
                                    <>
                                        <h2 className="text-lg font-extrabold tracking-tight truncate">
                                            {(lastResult.data?.student || lastResult.student).full_name}
                                        </h2>
                                        <div className="flex items-center gap-3 text-xs text-stone-300 mt-0.5">
                                            <span>Kelas: <b className="text-white">{(lastResult.data?.student || lastResult.student).grade}</b></span>
                                            <span>NISN: <b className="font-mono text-white">{(lastResult.data?.student || lastResult.student).nisn}</b></span>
                                        </div>
                                        {lastResult.status === 'WRONG_CLASS' && (
                                            <div className="mt-2 text-xs font-semibold text-rose-250 bg-rose-900/70 p-2 rounded-lg border border-rose-700/60 text-rose-100">
                                                ⚠️ {lastResult.message}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <h2 className="text-sm font-bold text-rose-300">{lastResult.message}</h2>
                                )}
                            </div>

                            <button
                                onClick={() => setLastResult(null)}
                                className="text-stone-400 hover:text-white p-1"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Bottom Action Bar: Manual Lookup & Simulation */}
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setManualModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 text-sm font-semibold active:scale-98 transition shadow-sm"
                    >
                        <Search className="w-4 h-4 text-amber-400" />
                        <span>Cari Manual via NISN / Nama Siswa</span>
                    </button>
                </div>

                {/* Session Scans List */}
                {recentScans.length > 0 && (
                    <div className="mt-2 bg-stone-900/80 rounded-xl p-3 border border-stone-800 text-xs">
                        <div className="font-bold text-stone-300 mb-2 flex items-center justify-between text-[11px]">
                            <span>Riwayat Sesi Ini ({recentScans.length})</span>
                            <span className="text-stone-500">Tersimpan di MySQL</span>
                        </div>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                            {recentScans.slice(0, 3).map((scan) => (
                                <div key={scan.id} className="flex items-center justify-between py-1 px-2 rounded bg-stone-950/50 border border-stone-850">
                                    <div className="truncate">
                                        <span className="font-medium text-stone-200">{scan.student_name}</span>
                                        <span className="text-[10px] text-stone-500 ml-1.5">({scan.class})</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <span className="font-mono text-[10px] text-stone-400">{scan.scanned_at}</span>
                                        <StatusBadge status={scan.status} size="sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Manual NISN Search Dialog */}
            {manualModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
                    <div className="bg-white text-stone-900 w-full max-w-md rounded-2xl shadow-2xl p-5 border border-stone-200">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                            <h2 className="text-base font-bold text-brand-primary flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Pencarian Presensi Manual
                            </h2>
                            <button
                                onClick={() => {
                                    setManualModalOpen(false);
                                    setManualSearchResult(null);
                                }}
                                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleManualLookup} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Masukkan NISN (10 Digit) atau Nama Siswa:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualNisn}
                                        onChange={(e) => setManualNisn(e.target.value)}
                                        placeholder="Contoh: 0078123401 atau Ahmad"
                                        className="flex-1 px-3 py-2 text-sm border rounded-lg border-stone-300 focus:ring-brand-primary focus:border-brand-primary"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-secondary"
                                    >
                                        Cari
                                    </button>
                                </div>
                            </div>
                        </form>

                        {manualSearchResult && (
                            <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                                {manualSearchResult === 'NOT_FOUND' ? (
                                    <p className="text-rose-600 font-semibold text-center py-2">
                                        Siswa tidak ditemukan pada data aktif.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="font-bold text-sm text-stone-900">
                                            {manualSearchResult.full_name}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-stone-600">
                                            <div>NISN: <span className="font-mono font-semibold">{manualSearchResult.nisn}</span></div>
                                            <div>Kelas: <span className="font-semibold">{manualSearchResult.grade}</span></div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={confirmManualAttendance}
                                            className="w-full mt-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
                                        >
                                            ✓ Konfirmasi Presensi Siswa Ini
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </ScannerLayout>
    );
}
