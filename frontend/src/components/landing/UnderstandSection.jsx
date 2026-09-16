import React, { useState } from 'react';
import { Activity, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../../hooks/LanguageContext';

const TRIAGE_CHIPS = [
    {
        id: 'fever',
        label: 'Persistent Fever',
        patientQuery: "Fever of 100.2°F for 3 days with dry cough.",
        triageSummary: "Mild upper-respiratory viral syndrome.",
        level: 'Non-Urgent • Level 4',
        markers: ['SpO2: 98% Normal', 'No respiratory distress', 'Hydration indicated']
    },
    {
        id: 'allergy',
        label: 'Skin Rash & Itching',
        patientQuery: "Localized red rash on forearm after gardening yesterday.",
        triageSummary: "Localized contact dermatitis reaction.",
        level: 'Mild Reaction',
        markers: ['No systemic involvement', 'Airway clear', 'Topical care recommended']
    },
    {
        id: 'migraine',
        label: 'Throbbing Headache',
        patientQuery: "Unilateral throbbing headache with mild light sensitivity.",
        triageSummary: "Episodic tension/migraine pattern.",
        level: 'Moderate Care',
        markers: ['No acute red flags', 'Photophobia noted', 'Rest protocol active']
    }
];

export const UnderstandSection = ({ onEnterPlatform }) => {
    const { t } = useLanguage();
    const [activeIdx, setActiveIdx] = useState(0);
    const active = TRIAGE_CHIPS[activeIdx];

    return (
        <section className="relative w-full py-16 md:py-24 px-6 md:px-12 max-w-6xl mx-auto z-20">
            {/* Header with minimal, confident copy */}
            <div className="flex flex-col items-start gap-3 mb-10 max-w-xl">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: 'var(--accent)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    {t("02 — Intelligent Intake")}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    {t("Clinical triage,")} <br />
                    <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                        {t("structured in seconds.")}
                    </span>
                </h2>
                <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t("Select a concern below to see how Sanjeevani translates symptoms into structured clinical context.")}
                </p>
            </div>

            {/* Interactive Symptom Chips */}
            <div className="flex flex-wrap gap-2.5 mb-8">
                {TRIAGE_CHIPS.map((chip, idx) => {
                    const isActive = activeIdx === idx;
                    return (
                        <button
                            key={chip.id}
                            onClick={() => setActiveIdx(idx)}
                            className="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
                            style={{
                                background: isActive ? 'var(--text-primary)' : 'var(--bg-surface)',
                                color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                border: isActive ? '1px solid transparent' : '1px solid var(--border)'
                            }}
                        >
                            {t(chip.label)}
                        </button>
                    );
                })}
            </div>

            {/* Interactive Preview Canvas */}
            <div className="w-full backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xs" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Patient Input Box */}
                    <div className="md:col-span-6 flex flex-col gap-3">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            {t("Patient Description")}
                        </span>
                        <div className="rounded-2xl p-4 text-sm font-medium leading-relaxed" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                            "{active.patientQuery}"
                        </div>
                    </div>

                    {/* Structured Clinical Output */}
                    <div className="md:col-span-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                {t("Structured Output")}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border" style={{ color: 'var(--pastel-mint-text)', background: 'var(--pastel-mint-bg)', borderColor: 'var(--pastel-mint-text)' }}>
                                {active.level}
                            </span>
                        </div>

                        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                            <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                {active.triageSummary}
                            </div>
                            <div className="flex flex-col gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                                {active.markers.map((m, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--pastel-mint-text)' }} />
                                        <span>{m}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t("Available across English, हिन्दी & বাংলা")}</span>
                    <button
                        onClick={onEnterPlatform}
                        className="text-xs font-bold hover:opacity-80 flex items-center gap-1.5 transition cursor-pointer"
                        style={{ color: 'var(--accent)' }}
                    >
                        <span>{t("Experience Full Triage")}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default UnderstandSection;
