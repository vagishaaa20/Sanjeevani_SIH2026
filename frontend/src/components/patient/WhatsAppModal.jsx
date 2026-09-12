import React, { useState } from 'react';
import api from '../../services/api';
import { CheckCircle2 } from 'lucide-react';

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
            <div
                className="rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col gap-6 relative animate-scale-in"
                style={{ background: 'var(--card-bg)', border: '2px solid var(--border)' }}
            >
                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-xl font-bold leading-none cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-secondary)' }}
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
                    <h3 className="text-xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>Connect on WhatsApp</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Get instant updates, find nearby doctors, book appointments, and run AI symptom checks — all from WhatsApp.
                    </p>
                </div>

                {/* Action area */}
                <div className="flex flex-col gap-3">
                    {status === 'idle' && (
                        <button
                            type="button"
                            onClick={handleSend}
                            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
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
                        <div
                            className="rounded-xl p-4 text-center flex flex-col gap-1"
                            style={{ background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-text)' }}
                        >
                            <p className="font-bold text-sm flex items-center justify-center gap-1.5" style={{ color: 'var(--pastel-mint-text)' }}>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Message sent!</span>
                            </p>
                            <p className="text-xs" style={{ color: 'var(--pastel-mint-text)' }}>
                                Check WhatsApp — a message from Sanjeevani will arrive shortly. Reply *MENU* to get started.
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div
                            className="rounded-xl p-4 flex flex-col gap-2"
                            style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)' }}
                        >
                            <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{errorMsg}</p>
                            <a
                                href={`https://wa.me/${WA_BUSINESS_NUMBER}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold underline hover:no-underline cursor-pointer"
                                style={{ color: 'var(--pastel-mint-text)' }}
                            >
                                Open WhatsApp directly →
                            </a>
                        </div>
                    )}

                    <p className="text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        A WhatsApp message will be sent to your registered phone number.
                    </p>
                </div>
            </div>
        </div>
    );
}
