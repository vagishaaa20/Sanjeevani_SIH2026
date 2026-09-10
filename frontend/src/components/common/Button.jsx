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
    const baseStyle = 'px-5 py-2.5 font-sans font-bold text-xs md:text-sm rounded-full shadow-xs hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#e13b68]/40 focus:ring-offset-2 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0';

    const styles = {
        primary: 'bg-[#e13b68] text-white hover:bg-[#c92a55] shadow-sm',
        secondary: 'bg-white text-[#2d2329] border border-[#f5e4ec] hover:bg-[#fdf0f4] hover:text-[#e13b68]',
        cerulean: 'bg-[#1e7ab8] text-white hover:bg-[#166092]',
        danger: 'bg-rose-600 text-white hover:bg-rose-700',
        ghost: 'bg-transparent text-[#2d2329] hover:bg-[#fdf0f4] hover:text-[#e13b68] shadow-none',
        outline: 'bg-white text-[#e13b68] border-2 border-[#e13b68] hover:bg-[#e13b68] hover:text-white',
        emergency: 'bg-[#e13b68] text-white hover:bg-[#c92a55] animate-pulse',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyle} ${styles[variant] || styles.primary} ${className}`}
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
