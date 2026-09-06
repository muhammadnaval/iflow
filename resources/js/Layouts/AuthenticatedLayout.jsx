import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import MadrasahLogo from '@/Components/MadrasahLogo';
import {
    LayoutDashboard,
    QrCode,
    FileSpreadsheet,
    Calendar,
    Contact2,
    FileText,
    Users,
    LogOut,
    Menu,
    X,
    Clock,
    ChevronRight,
    Sparkles,
    UserCheck,
    Bell
} from 'lucide-react';

export default function AuthenticatedLayout({ header, children, currentPresenceWindow }) {
    const { auth, activeAcademicYear, url } = usePage().props;
    const user = auth?.user || { name: 'Administrator', email: 'admin@mtsn3padang.sch.id', role: 'admin' };
    const role = (user.role || 'admin').toLowerCase();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update real-time clock in top bar
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Presence Window & Real-time Status
    const startTimeStr = currentPresenceWindow?.start_time || activeAcademicYear?.presence_start_time || '11:45';
    const endTimeStr = currentPresenceWindow?.end_time || activeAcademicYear?.presence_end_time || '12:30';
    const academicYearName = activeAcademicYear?.name || '2025/2026';
    const timeWindowFormatted = `${startTimeStr.replace(':', '.')} – ${endTimeStr.replace(':', '.')} WIB`;

    // Calculate real-time presence status: 'NOT_OPEN' | 'OPEN' | 'CLOSED'
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    const startMinutes = (isNaN(startH) ? 11 : startH) * 60 + (isNaN(startM) ? 45 : startM);
    const endMinutes = (isNaN(endH) ? 12 : endH) * 60 + (isNaN(endM) ? 30 : endM);

    let statusType = 'OPEN';
    if (currentMinutes < startMinutes) {
        statusType = 'NOT_OPEN';
    } else if (currentMinutes > endMinutes) {
        statusType = 'CLOSED';
    } else {
        statusType = 'OPEN';
    }

    // Format Indonesian Date & Time
    const formattedDate = currentTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    // Determine navigation links based on Role
    const allNavItems = [
        {
            name: 'Dashboard Realtime',
            href: route('dashboard'),
            icon: LayoutDashboard,
            roles: ['admin', 'petugas', 'kepala'],
            current: route().current('dashboard') || route().current('dashboard.*'),
        },
        {
            name: 'Scan Presensi QR',
            href: route('scan.index'),
            icon: QrCode,
            roles: ['admin', 'petugas'],
            current: route().current('scan.*'),
            highlight: true,
        },
        {
            name: 'Import Data Siswa',
            href: route('admin.students.import'),
            icon: FileSpreadsheet,
            roles: ['admin'],
            current: route().current('admin.students.import'),
        },
        {
            name: 'Cetak Kartu QR',
            href: route('admin.students.qr-cards'),
            icon: Contact2,
            roles: ['admin'],
            current: route().current('admin.students.qr-cards'),
        },
        {
            name: 'Tahun Ajaran & Waktu',
            href: route('admin.academic-years.index'),
            icon: Calendar,
            roles: ['admin'],
            current: route().current('admin.academic-years.*'),
        },
        {
            name: 'Laporan Bulanan',
            href: route('reports.monthly'),
            icon: FileText,
            roles: ['admin', 'kepala'],
            current: route().current('reports.*'),
        },
        {
            name: 'Manajemen Petugas',
            href: route('admin.users.index'),
            icon: Users,
            roles: ['admin'],
            current: route().current('admin.users.*'),
        },
    ];

    const authorizedNavItems = allNavItems.filter((item) => item.roles.includes(role));

    // Bottom navigation items for mobile view (4 items max)
    const mobileBottomItems = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: LayoutDashboard,
            current: route().current('dashboard'),
            show: true,
        },
        {
            name: 'Scan QR',
            href: route('scan.index'),
            icon: QrCode,
            current: route().current('scan.*'),
            show: ['admin', 'petugas'].includes(role),
            isAction: true,
        },
        {
            name: role === 'kepala' ? 'Laporan' : 'Data Siswa',
            href: role === 'kepala' ? route('reports.monthly') : route('admin.students.import'),
            icon: role === 'kepala' ? FileText : FileSpreadsheet,
            current: role === 'kepala' ? route().current('reports.*') : route().current('admin.students.*'),
            show: ['admin', 'kepala'].includes(role),
        },
        {
            name: 'Pengaturan',
            href: role === 'admin' ? route('admin.academic-years.index') : route('profile.edit'),
            icon: Calendar,
            current: route().current('admin.academic-years.*') || route().current('profile.*'),
            show: true,
        },
    ].filter((item) => item.show);

    return (
        <div className="min-h-screen bg-madrasah-bg flex flex-col font-sans text-madrasah-fg">
            {/* Top Desktop & Mobile Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-madrasah-border shadow-2xs no-print">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg text-madrasah-muted hover:text-madrasah-fg hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <Link href={route('dashboard')} className="flex items-center">
                            <MadrasahLogo showText={true} />
                        </Link>
                    </div>

                    {/* Center: Live Time Window Status (Desktop) */}
                    <div className={`hidden md:flex items-center gap-3 border rounded-full px-3.5 py-1 text-xs transition-colors ${
                        statusType === 'OPEN'
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                            : statusType === 'NOT_OPEN'
                            ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}>
                        <div className="flex items-center gap-1.5 font-semibold">
                            <span className="relative flex h-2 w-2">
                                {statusType === 'OPEN' ? (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </>
                                ) : statusType === 'NOT_OPEN' ? (
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                ) : (
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-400"></span>
                                )}
                            </span>
                            <span>Presensi Dzuhur: {timeWindowFormatted}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                statusType === 'OPEN'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : statusType === 'NOT_OPEN'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-stone-200/80 text-stone-600 border-stone-300'
                            }`}>
                                {statusType === 'OPEN' ? 'Buka' : statusType === 'NOT_OPEN' ? 'Belum Buka' : 'Selesai'}
                            </span>
                        </div>
                        <div className="h-3 w-px bg-stone-300"></div>
                        <div className="flex items-center gap-1 font-mono text-stone-700 font-medium">
                            <Clock className={`w-3.5 h-3.5 ${statusType === 'OPEN' ? 'text-emerald-700' : statusType === 'NOT_OPEN' ? 'text-amber-700' : 'text-stone-500'}`} />
                            <span>{formattedTime}</span>
                        </div>
                    </div>

                    {/* Right User Bar */}
                    <div className="flex items-center gap-3">
                        {/* Role Indicator Badge */}
                        <div className="hidden sm:flex flex-col items-end text-right">
                            <span className="text-xs font-bold text-madrasah-fg truncate max-w-[150px]">
                                {user.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-brand-primary text-brand-accent">
                                {role === 'admin' ? 'Administrator' : role === 'petugas' ? 'Petugas Piket' : 'Kepala Madrasah'}
                            </span>
                        </div>

                        {/* Direct Logout Button */}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="p-2 rounded-lg text-madrasah-muted hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                            title="Keluar / Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Application Shell */}
            <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
                {/* Desktop Vertical Sidebar (> 1024px) */}
                <aside className="hidden lg:block w-64 flex-shrink-0 no-print">
                    <div className="sticky top-24 bg-white border border-madrasah-border rounded-xl p-3 shadow-2xs space-y-1">
                        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-madrasah-muted">
                            Menu Utama
                        </div>

                        <nav className="space-y-1">
                            {authorizedNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.current;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-brand-primary text-white shadow-xs font-semibold'
                                                : item.highlight
                                                ? 'bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100 font-semibold'
                                                : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Icon className={`w-4 h-4 flex-shrink-0 ${
                                                isActive ? 'text-brand-accent' : item.highlight ? 'text-amber-700' : 'text-madrasah-muted'
                                            }`} />
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                        {isActive && <ChevronRight className="w-4 h-4 text-brand-accent" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Academic Year Info Widget */}
                        <div className="mt-4 pt-3 border-t border-madrasah-border px-3 py-2 bg-stone-50 rounded-lg text-xs">
                            <div className="text-madrasah-muted font-medium text-[11px]">Tahun Ajaran Aktif</div>
                            <div className="font-bold text-brand-primary text-sm flex items-center justify-between mt-0.5">
                                <span>{academicYearName}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Aktif</span>
                            </div>
                            <div className="text-[11px] text-stone-500 mt-1.5 flex items-center justify-between">
                                <span>Dzuhur: {timeWindowFormatted}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    statusType === 'OPEN'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : statusType === 'NOT_OPEN'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-stone-200 text-stone-600'
                                }`}>
                                    {statusType === 'OPEN' ? 'Buka' : statusType === 'NOT_OPEN' ? 'Belum Buka' : 'Selesai'}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Mobile Drawer Navigation */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div
                            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
                            onClick={() => setMobileMenuOpen(false)}
                        ></div>

                        <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl p-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-4 border-b border-madrasah-border">
                                    <MadrasahLogo showText={true} />
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <nav className="mt-4 space-y-1">
                                    {authorizedNavItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = item.current;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                                                    isActive
                                                        ? 'bg-brand-primary text-white font-semibold'
                                                        : 'text-stone-700 hover:bg-stone-100'
                                                }`}
                                            >
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-accent' : 'text-madrasah-muted'}`} />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>

                            <div className="pt-4 border-t border-madrasah-border space-y-3">
                                <div className="px-3 py-2 bg-stone-50 rounded-lg text-xs border border-stone-200">
                                    <div className="text-madrasah-muted font-medium text-[11px]">Tahun Ajaran Aktif</div>
                                    <div className="font-bold text-brand-primary text-sm flex items-center justify-between mt-0.5">
                                        <span>{academicYearName}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Aktif</span>
                                    </div>
                                    <div className="text-[11px] text-stone-500 mt-1.5 flex items-center justify-between">
                                        <span>Dzuhur: {timeWindowFormatted}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            statusType === 'OPEN'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : statusType === 'NOT_OPEN'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-stone-200 text-stone-600'
                                        }`}>
                                            {statusType === 'OPEN' ? 'Buka' : statusType === 'NOT_OPEN' ? 'Belum Buka' : 'Selesai'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-xs text-madrasah-muted">
                                    Masuk sebagai: <b className="text-madrasah-fg">{user.name}</b>
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Keluar dari Aplikasi
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Primary Content Container */}
                <main className="flex-1 min-w-0 pb-20 lg:pb-6">
                    {header && (
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-madrasah-border/80 pb-4">
                            {header}
                        </div>
                    )}

                    {children}
                </main>
            </div>

            {/* Mobile Bottom Fixed Navigation Bar (< 640px) */}
            <nav
                aria-label="Navigasi Bawah Mobile"
                className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-madrasah-border shadow-lg px-2 py-1.5 flex items-center justify-around no-print"
            >
                {mobileBottomItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.current;
                    if (item.isAction) {
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex flex-col items-center justify-center -mt-5 bg-brand-primary text-brand-accent p-3 rounded-full shadow-lg border-2 border-white focus:outline-none"
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-[10px] font-bold text-white mt-0.5">{item.name}</span>
                            </Link>
                        );
                    }
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[11px] font-medium min-w-[64px] min-h-[44px] ${
                                isActive
                                    ? 'text-brand-primary font-bold'
                                    : 'text-madrasah-muted hover:text-stone-900'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-brand-primary' : 'text-stone-400'}`} />
                            <span className="mt-0.5">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
