import React from 'react';

export default function MadrasahLogo({ className = "w-10 h-10", showText = false, textClassName = "" }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm overflow-hidden flex-shrink-0 ${className}`}>
                {/* Background Islamic Pattern Accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary to-brand-primary opacity-90"></div>
                <div className="absolute -right-2 -bottom-2 w-8 h-8 rounded-full border border-brand-accent/40 pointer-events-none"></div>
                
                {/* Logo Icon */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="relative z-10 w-3/5 h-3/5 text-brand-accent"
                >
                    {/* Mosque Dome & Minaret Geometric Graphic */}
                    <path d="M12 3v3" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M7 9a5 5 0 0 1 10 0v2H7V9z" fill="currentColor" fillOpacity="0.2" />
                    <path d="M3 21h18" strokeWidth="2.5" />
                    <path d="M5 21v-8h14v8" />
                    <path d="M9 21v-5a3 3 0 0 1 6 0v5" fill="#F9A825" fillOpacity="0.4" />
                    <circle cx="12" cy="3" r="1" fill="#F9A825" stroke="none" />
                </svg>
            </div>

            {showText && (
                <div className={`flex flex-col leading-tight ${textClassName}`}>
                    <span className="font-extrabold text-base tracking-tight text-brand-primary flex items-center gap-1.5">
                        I-<span className="text-brand-accent">FLOW</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                            MTsN 3 Kota Padang
                        </span>
                    </span>
                    <span className="text-xs text-madrasah-muted font-medium">
                        Ibadah Fast, Logged, On-time, and Online-Way
                    </span>
                </div>
            )}
        </div>
    );
}
