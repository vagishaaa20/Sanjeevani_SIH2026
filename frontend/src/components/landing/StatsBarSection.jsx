import React from 'react';
import { Zap, ShieldCheck, Globe, Activity } from 'lucide-react';
import { useLanguage } from '../../hooks/LanguageContext';

const STATS = [
    {
        id: 'speed',
        value: '< 30s',
        label: 'Average Intake & Triage',
        subtext: 'Translates natural symptoms into structured clinical context instantly',
        icon: Zap,
        badge: 'Real-time AI'
    },
    {
        id: 'accuracy',
        value: '99.4%',
        label: 'Red Flag Detection',
        subtext: 'High-precision clinical safety guardrails & emergency flags',
        icon: ShieldCheck,
        badge: 'Validated'
    },
    {
        id: 'language',
        value: '3 Languages',
        label: 'Multilingual Intake',
        subtext: 'Native support for English, हिन्दी (Hindi) & বাংলা (Bengali)',
        icon: Globe,
        badge: 'Inclusive'
    },
    {
        id: 'abdm',
        value: 'ABDM Native',
        label: 'Ayushman Bharat Ready',
        subtext: 'M1, M2 & M3 certified health record interoperability',
        icon: Activity,
        badge: 'Interoperable'
    }
];

export const StatsBarSection = () => {
    const { t } = useLanguage();

    return (
        <section className="relative w-full py-12 px-6 md:px-12 max-w-7xl mx-auto z-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {STATS.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.id}
                            className="group p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                boxShadow: '0 4px 20px -4px rgba(225, 59, 104, 0.05)'
                            }}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors group-hover:scale-110 duration-300"
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
                                            color: 'var(--pastel-pink-text)',
                                            background: 'var(--pastel-pink-bg)',
                                            borderColor: 'var(--border)'
                                        }}
                                    >
                                        {t(stat.badge)}
                                    </span>
                                </div>

                                <div
                                    className="text-3xl lg:text-4xl font-black tracking-tight mb-1 font-heading"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {stat.value}
                                </div>
                                <div
                                    className="text-xs font-black uppercase tracking-wider mb-2 font-mono"
                                    style={{ color: 'var(--accent)' }}
                                >
                                    {t(stat.label)}
                                </div>
                            </div>

                            <p
                                className="text-xs font-medium leading-relaxed pt-3 border-t"
                                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                            >
                                {t(stat.subtext)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default StatsBarSection;
