import React from 'react';

export default function Button({
    type = 'button',
    variant = 'primary', // 'accent' (gold), 'primary' (green), 'secondary' (outline), 'danger', 'tertiary'
    size = 'md', // 'sm', 'md', 'lg'
    className = '',
    disabled = false,
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    children,
    ...props
}) {
    const baseClasses = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none select-none min-h-[38px] sm:min-h-[40px]";

    const sizeClasses = {
        sm: "text-xs px-3 py-1.5 gap-1.5 min-h-[36px]",
        md: "text-sm px-4 py-2 gap-2 min-h-[40px]",
        lg: "text-base px-5 py-2.5 gap-2.5 min-h-[44px]",
    }[size] || "text-sm px-4 py-2 gap-2";

    const variantClasses = {
        accent: "bg-brand-accent hover:bg-brand-accent-hover text-stone-900 shadow-sm border border-amber-500 font-bold",
        primary: "bg-brand-primary hover:bg-brand-secondary text-white shadow-sm border border-brand-700 font-semibold",
        secondary: "bg-white hover:bg-stone-50 text-madrasah-fg border border-madrasah-border shadow-xs",
        outline: "bg-transparent hover:bg-brand-50 text-brand-primary border border-brand-primary/40",
        danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-700",
        dangerOutline: "bg-white hover:bg-rose-50 text-rose-600 border border-rose-300",
        tertiary: "bg-transparent hover:bg-stone-100 text-madrasah-muted hover:text-madrasah-fg border-transparent",
    }[variant] || "bg-brand-primary text-white";

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!loading && Icon && iconPosition === 'left' && (
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            )}
            <span>{children}</span>
            {!loading && Icon && iconPosition === 'right' && (
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            )}
        </button>
    );
}
