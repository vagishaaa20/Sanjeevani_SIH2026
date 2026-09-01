import React, { useState } from 'react';
import api from '../../services/api';

const WA_BUSINESS_NUMBER = import.meta.env.VITE_WA_BUSINESS_NUMBER || '919999999999'; // fallback

export default function WhatsAppModal({ isOpen, onClose }) {
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSend = async () => {
        setStatus('loading');
        setErrorMsg('');
        try {
            await api.post('/whatsapp/send', {});
            setStatus('success');
        } catch (err) {
            const msg = err.response?.data?.error || 'Something went wrong. Please try the direct link below.';
            setErrorMsg(msg);
            setStatus('error');
        }
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="WhatsApp Connect"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col gap-6 relative animate-scale-in">
                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-ink-muted hover:text-ink-black text-xl font-bold leading-none"
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Icon + heading */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                        style={{ backgroundColor: '#25D366' }}
                        aria-hidden="true"
                    >
                        💬
                    </div>
                    <h3 className="text-xl font-black text-ink-black">Connect on WhatsApp</h3>
                    <p className="text-sm text-ink-charcoal">
                        Get instant updates, find nearby doctors, book appointments, and run AI symptom checks — all from WhatsApp.
                    </p>
                </div>

                {/* Action area */}
                <div className="flex flex-col gap-3">
                    {status === 'idle' && (
                        <button
                            type="button"
                            onClick={handleSend}
                            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                            style={{ backgroundColor: '#25D366' }}
                        >
                            Send me a message →
                        </button>
                    )}

                    {status === 'loading' && (
                        <button
                            type="button"
                            disabled
                            className="w-full py-3 rounded-xl font-bold text-white text-sm opacity-70 cursor-not-allowed"
                            style={{ backgroundColor: '#25D366' }}
                        >
                            Sending…
                        </button>
                    )}

                    {status === 'success' && (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-center flex flex-col gap-1">
                            <p className="font-bold text-emerald-700 text-sm">✅ Message sent!</p>
                            <p className="text-xs text-emerald-600">
                                Check WhatsApp — a message from Sanjeevani will arrive shortly. Reply *MENU* to get started.
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex flex-col gap-2">
                            <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
                            <a
                                href={`https://wa.me/${WA_BUSINESS_NUMBER}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-emerald-700 underline hover:no-underline"
                            >
                                Open WhatsApp directly →
                            </a>
                        </div>
                    )}

                    <p className="text-center text-[10px] text-ink-muted">
                        A WhatsApp message will be sent to your registered phone number.
                    </p>
                </div>
            </div>
        </div>
    );
}
