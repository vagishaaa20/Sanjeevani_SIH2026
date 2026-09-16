import React from 'react';
import { Lock, ShieldCheck, WifiOff, Award } from 'lucide-react';
import { useLanguage } from '../../hooks/LanguageContext';

const TRUST_CARDS = [
    {
        id: 'abdm',
        title: 'ABDM Native Interoperability',
        subtitle: 'Ayushman Bharat Digital Mission',
        icon: Award,
        badge: 'Certified',
        desc: 'Seamless ABHA card linking, milestone M1/M2/M3 compliance, and instant health record transfer across registered health facilities in India.'
    },
    {
        id: 'encryption',
        title: 'AES-256 & Data Sovereignty',
        subtitle: 'Bank-Grade Security Standards',
        icon: Lock,
        badge: 'Encrypted',
        desc: 'End-to-end encrypted storage ensures patient data remains private, tamper-proof, and solely accessible by authorized clinicians and patients.'
    },
    {
        id: 'offline',
        title: 'Offline Rural Resilience',
        subtitle: 'Zero-Downtime Care Delivery',
        icon: WifiOff,
        badge: 'Rural Ready',
        desc: 'Designed for remote healthcare workers to conduct intake screenings without active internet, syncing automatically upon reconnection.'
    },
    {
        id: 'guardrails',
        title: 'Clinical Safety Guardrails',
        subtitle: 'Human-in-the-Loop AI',
        icon: ShieldCheck,
        badge: 'AI Safety',
        desc: 'Our AI model operates within strict medical protocols. High-severity flags immediately route cases for human doctor review.'
    }
];

export const SecurityTrustSection = () => {
    const { t } = useLanguage();

    return (
        <section className="relative w-full py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto z-20">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3 mb-12 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: 'var(--accent)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    {t("05 — Trust & Compliance")}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    {t("Built on uncompromising")} <br />
                    <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                        {t("clinical security & standards.")}
                    </span>
                </h2>
                <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t("Protecting patient privacy while maintaining national health grid interoperability across urban and rural clinical settings.")}
                </p>
            </div>

            {/* Trust Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {TRUST_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.id}
                            className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                boxShadow: '0 4px 20px -4px rgba(225, 59, 104, 0.05)'
                            }}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors"
                                        style={{
                                            background: 'var(--accent-light)',
                                            color: 'var(--accent)'
                                        }}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span
                                        className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                                        style={{
                                            color: 'var(--pastel-mint-text)',
                                            background: 'var(--pastel-mint-bg)',
                                            borderColor: 'var(--pastel-mint-text)'
                                        }}
                                    >
                                        {t(card.badge)}
                                    </span>
                                </div>

                                <div className="text-xs font-bold uppercase tracking-wider mb-1 font-mono" style={{ color: 'var(--accent)' }}>
                                    {t(card.subtitle)}
                                </div>
                                <h3 className="text-lg font-bold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
                                    {t(card.title)}
                                </h3>
                            </div>

                            <p className="text-xs font-medium leading-relaxed pt-3 border-t" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                                {t(card.desc)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default SecurityTrustSection;
