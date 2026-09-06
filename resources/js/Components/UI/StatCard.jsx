import React from 'react';

export default function StatCard({
    title,
    value,
    unit = "",
    subtitle,
    icon: Icon,
    iconColor = "text-brand-primary",
    iconBg = "bg-brand-50",
    badge,
    badgeType = "neutral",
    onClick,
    className = ""
}) {
    const badgeColors = {
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-800 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        neutral: "bg-gray-100 text-gray-700 border-gray-200",
    }[badgeType] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <div
            onClick={onClick}
            className={`bg-white border border-madrasah-border rounded-xl p-4 sm:p-5 transition-all duration-150 ${
                onClick ? 'cursor-pointer hover:border-brand-primary/50 hover:shadow-sm' : ''
            } ${className}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-madrasah-muted truncate">
                        {title}
                    </p>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-2xl sm:text-3xl font-extrabold text-madrasah-fg tracking-tight">
                            {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                        </span>
                        {unit && (
                            <span className="text-xs font-medium text-madrasah-muted font-sans">
                                {unit}
                            </span>
                        )}
                    </div>
                </div>

                {Icon && (
                    <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor} flex-shrink-0`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                )}
            </div>

            {(subtitle || badge) && (
                <div className="mt-3.5 pt-3 border-t border-madrasah-border/60 flex items-center justify-between text-xs">
                    {subtitle && (
                        <span className="text-madrasah-muted truncate">
                            {subtitle}
                        </span>
                    )}
                    {badge && (
                        <span className={`px-2 py-0.5 rounded-md font-medium border text-[11px] ml-auto ${badgeColors}`}>
                            {badge}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
