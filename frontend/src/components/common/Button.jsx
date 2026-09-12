import React from 'react';

export const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    loading = false,
    disabled = false,
    className = '',
    ...props
}) => {
    const baseStyle = 'px-5 py-2.5 font-sans font-bold text-xs md:text-sm rounded-full shadow-xs hover:-translate-y-0.5 active:translate-y-0 focus:outline-none transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0';

    const getStyle = (v) => {
        switch (v) {
            case 'primary':
                return { background: 'var(--accent)', color: '#fff', border: 'none' };
            case 'secondary':
                return { background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' };
            case 'cerulean':
                return { background: 'var(--pastel-sky-text)', color: '#fff', border: 'none' };
            case 'danger':
                return { background: '#dc2626', color: '#fff', border: 'none' };
            case 'ghost':
                return { background: 'transparent', color: 'var(--text-primary)', border: 'none', boxShadow: 'none' };
            case 'outline':
                return { background: 'var(--card-bg)', color: 'var(--accent)', border: '2px solid var(--accent)' };
            case 'emergency':
                return { background: 'var(--accent)', color: '#fff', border: 'none', animation: 'pulse 2s infinite' };
            default:
                return { background: 'var(--accent)', color: '#fff', border: 'none' };
        }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyle} ${className}`}
            style={getStyle(variant)}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
