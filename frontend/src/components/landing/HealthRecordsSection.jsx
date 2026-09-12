import React, { useState } from 'react';
import { Pill, Activity, ShieldCheck, FileCheck } from 'lucide-react';

const VAULT_ITEMS = [
    {
        id: 'rx',
        label: 'Digital Prescription',
        icon: Pill,
        badge: 'Encrypted & Signed',
        title: 'Instant Electronic Prescriptions',
        desc: 'Standardized medication plans with dosage intervals and refill schedules synced instantly to your patient profile.'
    },
    {
        id: 'lab',
        label: 'Diagnostic Panels',
        icon: Activity,
        badge: 'Automatic Ranges',
        title: 'Structured Biomarkers',
        desc: 'Lab reports automatically parsed with healthy reference intervals for clear patient understanding.'
    },
    {
        id: 'vault',
        label: 'Care History',
        icon: FileCheck,
        badge: 'ABDM Native',
        title: 'Unified Health Records',
        desc: 'Complete continuity across consultations, referrals, and diagnostic tests securely accessible in one place.'
    }
];

export const HealthRecordsSection = () => {
    const [activeIdx, setActiveIdx] = useState(0);

    return (
        <section className="relative w-full py-16 md:py-24 px-6 md:px-12 max-w-6xl mx-auto z-20">
            {/* Minimal Header */}
            <div className="flex flex-col items-start gap-3 mb-10 max-w-xl">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: 'var(--accent)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    03 — Digital Health Vault
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    Unified records, <br />
                    <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                        always accessible.
                    </span>
                </h2>
                <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    All your triage histories, electronic prescriptions, and diagnostic records organized in one secure dashboard.
                </p>
            </div>

            {/* Interactive Vault Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {VAULT_ITEMS.map((item, idx) => {
                    const isSelected = activeIdx === idx;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveIdx(idx)}
                            className="p-6 rounded-3xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between min-h-[220px]"
                            style={{
                                background: isSelected ? 'var(--bg-surface)' : 'var(--card-bg)',
                                borderColor: isSelected ? 'var(--accent)' : 'var(--border)'
                            }}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors"
                                    style={{
                                        background: isSelected ? 'var(--accent-light)' : 'var(--bg-primary)',
                                        color: isSelected ? 'var(--accent)' : 'var(--text-muted)'
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span
                                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                                    style={{
                                        color: 'var(--pastel-mint-text)',
                                        background: 'var(--pastel-mint-bg)',
                                        borderColor: 'var(--pastel-mint-text)'
                                    }}
                                >
                                    {item.badge}
                                </span>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-bold text-base mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                    {item.title}
                                </h3>
                                <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    {item.desc}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default HealthRecordsSection;
