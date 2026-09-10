import React, { useEffect } from 'react';

export const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-6xl',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2d2329]/40 backdrop-blur-sm animate-fade-in-up"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`w-full ${sizes[size] || sizes.md} p-6 bg-white border border-[#f5e4ec] rounded-3xl shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${className}`}
            >
                <div className="flex justify-between items-center pb-3 border-b border-[#f5e4ec] sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-black tracking-tight text-[#2d2329] font-heading">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#fdf0f4] border border-[#f5e4ec] flex items-center justify-center text-[#7d6974] hover:text-[#e13b68] hover:bg-[#ffe6ee] font-bold transition duration-150 cursor-pointer"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>
                <div className="text-[#4a3c45]">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
