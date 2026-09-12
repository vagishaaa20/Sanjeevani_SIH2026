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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up"
            style={{ background: 'rgba(10, 2, 8, 0.5)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`w-full ${sizes[size] || sizes.md} p-6 rounded-3xl shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${className}`}
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                }}
            >
                <div
                    className="flex justify-between items-center pb-3 border-b sticky top-0 z-10"
                    style={{
                        borderColor: 'var(--border)',
                        background: 'var(--card-bg)',
                    }}
                >
                    <h3
                        className="text-lg font-black tracking-tight font-heading"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold transition duration-150 cursor-pointer"
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                        }}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{children}</div>
            </div>
        </div>
    );
};

export default Modal;
