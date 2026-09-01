import React from 'react';

export const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-black/40 backdrop-blur-sm animate-fade-in-up">
            <div className="w-full max-w-lg p-6 bg-white border-2 border-ink-black rounded-2xl shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-cream-surface">
                    <h3 className="text-lg font-bold text-ink-black">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-ink-muted hover:text-ink-black font-semibold text-lg hover:rotate-90 transition duration-150 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
                <div className="text-ink-charcoal">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
