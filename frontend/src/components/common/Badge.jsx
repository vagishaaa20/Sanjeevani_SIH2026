import React from 'react';

export const Badge = ({ children, variant = 'info', dot = false, pulse = false, className = '' }) => {
    const styles = {
        info: 'bg-[#ffe6ee] text-[#e13b68] border-[#f8c8d8]',
        pink: 'bg-[#ffe6ee] text-[#e13b68] border-[#f8c8d8]',
        success: 'bg-[#e6f9f0] text-[#10b981] border-[#b6f0d4]',
        mint: 'bg-[#e6f9f0] text-[#10b981] border-[#b6f0d4]',
        warning: 'bg-[#fff0e6] text-[#e07a38] border-[#ffd5bf]',
        peach: 'bg-[#fff0e6] text-[#e07a38] border-[#ffd5bf]',
        danger: 'bg-[#f3e8ff] text-[#7c3aed] border-[#e0c4ff]',
        lavender: 'bg-[#f3e8ff] text-[#7c3aed] border-[#e0c4ff]',
        emergency: 'bg-[#e13b68] text-white border-transparent shadow-xs',
        muted: 'bg-[#fdf0f4] text-[#7d6974] border-[#f3dce5]',
    };

    const dotColors = {
        info: 'bg-[#e13b68]',
        pink: 'bg-[#e13b68]',
        success: 'bg-[#10b981]',
        mint: 'bg-[#10b981]',
        warning: 'bg-[#e07a38]',
        peach: 'bg-[#e07a38]',
        danger: 'bg-[#7c3aed]',
        lavender: 'bg-[#7c3aed]',
        emergency: 'bg-white',
        muted: 'bg-[#7d6974]',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full border tracking-tight ${styles[variant] || styles.info} ${className}`}
        >
            {dot && (
                <span className="relative flex h-2 w-2">
                    {pulse && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant] || 'bg-[#e13b68]'}`} />
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[variant] || 'bg-[#e13b68]'}`} />
                </span>
            )}
            {children}
        </span>
    );
};

export default Badge;
