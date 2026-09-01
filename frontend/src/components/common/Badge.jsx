import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
    const styles = {
        info: 'bg-pastel-sky-soft text-cerulean-dark border-pastel-sky',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
    };

    return (
        <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[variant] || styles.info} ${className}`}
        >
            {children}
        </span>
    );
};

export default Badge;
