import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', ...props }) => {
    const baseStyle = 'px-6 py-2.5 font-sans font-semibold rounded-full border border-ink-black shadow shadow-ink-black/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2';
    const styles = {
        primary: 'bg-pastel-pink-action text-white hover:bg-pastel-pink-action-hover border border-ink-black',
        secondary: 'bg-white text-ink-black hover:bg-ink-black hover:text-white border border-ink-black',
        cerulean: 'bg-cerulean text-white hover:bg-cerulean-dark border border-ink-black',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${styles[variant] || styles.primary} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
