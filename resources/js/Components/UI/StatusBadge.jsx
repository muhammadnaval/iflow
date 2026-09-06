import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, UserX, Archive, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status, size = "md", className = "" }) {
    const s = (status || '').toUpperCase();

    const sizeClasses = {
        sm: "text-[11px] px-2 py-0.5 gap-1",
        md: "text-xs px-2.5 py-1 gap-1.5",
        lg: "text-sm px-3.5 py-1.5 gap-2 font-semibold",
    }[size] || "text-xs px-2.5 py-1 gap-1.5";

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-3.5 h-3.5",
        lg: "w-4 h-4",
    }[size] || "w-3.5 h-3.5";

    let label = s;
    let style = "bg-gray-100 text-gray-700 border-gray-200";
    let Icon = CheckCircle2;

    switch (s) {
        case 'HADIR':
            label = 'Hadir Tepat Waktu';
            style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            Icon = CheckCircle2;
            break;
        case 'TERLAMBAT':
            label = 'Terlambat';
            style = 'bg-amber-50 text-amber-900 border-amber-300';
            Icon = Clock;
            break;
        case 'DUPLICATE':
        case 'DUPLIKAT':
            label = 'Duplikat (Sudah Scan)';
            style = 'bg-orange-50 text-orange-900 border-orange-300';
            Icon = AlertTriangle;
            break;
        case 'REJECTED':
            label = 'Ditolak';
            style = 'bg-red-50 text-red-800 border-red-200';
            Icon = XCircle;
            break;
        case 'REJECTED_EARLY':
            label = 'Ditolak (Belum Waktunya)';
            style = 'bg-red-50 text-red-800 border-red-200';
            Icon = Clock;
            break;
        case 'REJECTED_LATE':
            label = 'Ditolak (Lewat Waktu)';
            style = 'bg-red-50 text-red-800 border-red-200';
            Icon = XCircle;
            break;
        case 'WRONG_CLASS':
            label = 'Bukan Kelas Binaan';
            style = 'bg-rose-100 text-rose-900 border-rose-300';
            Icon = XCircle;
            break;
        case 'TIDAK_HADIR':
        case 'ALPHA':
            label = 'Tidak Hadir';
            style = 'bg-rose-50 text-rose-800 border-rose-200';
            Icon = UserX;
            break;
        case 'NOT_FOUND':
            label = 'NISN Tidak Ditemukan';
            style = 'bg-gray-100 text-gray-800 border-gray-300';
            Icon = XCircle;
            break;
        case 'AKTIF':
        case 'ACTIVE':
            label = 'Aktif';
            style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            Icon = ShieldCheck;
            break;
        case 'ARSIP':
        case 'ARCHIVED':
            label = 'Arsip';
            style = 'bg-slate-100 text-slate-700 border-slate-300';
            Icon = Archive;
            break;
        default:
            label = s;
            style = 'bg-gray-100 text-gray-700 border-gray-200';
            Icon = CheckCircle2;
    }

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full border ${style} ${sizeClasses} ${className}`}
            role="status"
            aria-label={`Status presensi: ${label}`}
        >
            <Icon className={`${iconSizes} flex-shrink-0`} aria-hidden="true" />
            <span>{label}</span>
        </span>
    );
}
