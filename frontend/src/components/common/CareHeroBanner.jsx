import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export const CareHeroBanner = ({
    headline = "Care. Connect. Heal.",
    tagline = "You are making a difference in someone's life today.",
    className = "",
}) => {
    return (
        <div
            className={`w-full rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs ${className}`}
            style={{
                background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--bg-surface) 60%, var(--accent-light) 100%)',
                border: '1px solid var(--border)',
            }}
        >
            {/* Background Decorative Shapes */}
            <div className="absolute top-3 right-1/3 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.08 }} />
            <div className="absolute -bottom-6 left-12 w-40 h-40 rounded-full blur-xl pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.06 }} />

            <div className="flex flex-col gap-2 z-10 max-w-xl text-left">
                <div className="flex items-center gap-2">
                    <span
                        className="px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 shadow-xs"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--accent)',
                        }}
                    >
                        <Sparkles className="w-3 h-3" />
                        <span>Sanjeevani Care Network</span>
                    </span>
                </div>

                <h2
                    className="text-2xl md:text-3xl font-black tracking-tight font-heading leading-tight mt-1"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {headline}
                </h2>

                <p className="text-sm font-semibold flex items-center gap-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <span>{tagline}</span>
                    <Heart className="w-4 h-4 inline-block flex-shrink-0 animate-pulse" style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />
                </p>
            </div>

            {/* SVG Illustration */}
            <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
                <div className="relative w-44 h-36 md:w-56 md:h-40 flex items-center justify-center">
                    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                        <circle cx="120" cy="80" r="65" fill="var(--card-bg)" fillOpacity="0.7" />
                        <circle cx="120" cy="80" r="55" fill="var(--accent-light)" fillOpacity="0.5" />
                        <path d="M120 50 C110 35 85 45 95 65 C105 85 120 100 120 100 C120 100 135 85 145 65 C155 45 130 35 120 50 Z" fill="var(--accent)" fillOpacity="0.85" />
                        <path d="M100 70 L112 70 L116 62 L124 78 L128 70 L140 70" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="75" cy="55" r="16" fill="var(--accent-light)" />
                        <path d="M63 50 C63 40 87 40 87 50 C87 55 63 55 63 50 Z" fill="var(--text-secondary)" />
                        <path d="M50 110 C50 82 100 82 100 110 Z" fill="var(--accent)" />
                        <path d="M75 82 L75 110" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />
                        <circle cx="165" cy="60" r="15" fill="var(--bg-hover)" />
                        <path d="M152 56 C152 48 178 48 178 56 Z" fill="var(--text-muted)" />
                        <path d="M142 110 C142 88 188 88 188 110 Z" fill="var(--text-secondary)" />
                        <circle cx="45" cy="40" r="3" fill="var(--accent)" />
                        <circle cx="195" cy="45" r="4" fill="var(--accent-light)" />
                        <circle cx="205" cy="95" r="2.5" fill="var(--accent)" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default CareHeroBanner;
