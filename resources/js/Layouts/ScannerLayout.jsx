import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Clock, Info, Shield } from 'lucide-react';

export default function ScannerLayout({ children, activeTimeWindow = "11:45 - 12:30 WIB" }) {
    return (
        <div className="min-h-screen bg-stone-950 text-white flex flex-col font-sans select-none">
            {/* Top Minimalist Header */}
            <header className="bg-stone-900/90 border-b border-stone-800 backdrop-blur-md px-4 py-3 flex items-center justify-between z-30">
                <Link
                    href={route('dashboard')}
                    className="flex items-center gap-2 text-stone-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-stone-800/80 active:scale-95 transition text-xs font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Dashboard</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-mono font-medium text-emerald-400">
                        {activeTimeWindow}
                    </span>
                </div>

                <div className="text-[11px] font-medium text-stone-400">
                    MTsN 3 Kota Padang
                </div>
            </header>

            {/* Main Full-Focus Viewport */}
            <main className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto p-4">
                {children}
            </main>
        </div>
    );
}
