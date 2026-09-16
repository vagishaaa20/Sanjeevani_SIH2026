import React, { useState } from 'react';
import { User, Stethoscope, HeartPulse, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../hooks/LanguageContext';

const ROLES = [
    {
        id: 'patient',
        title: 'Patients',
        subtitle: 'Empowered, calm healthcare intake',
        icon: User,
        badge: 'Intelligent Self-Care',
        headline: 'Speak or type your symptoms naturally',
        description: 'Sanjeevani breaks down complex medical jargon into easy-to-understand guidance while keeping your complete health history securely at your fingertips.',
        points: [
            'Conversational AI intake in English, Hindi, and Bengali',
            'Structured risk severity score with clear action steps',
            'Digital Health Vault with instant prescription access',
            'Seamless doctor consultation linking & appointment booking'
        ],
        previewCard: {
            title: 'Patient Portal Preview',
            status: 'Intake Completed',
            tag: 'Level 4 Triage',
            details: [
                { label: 'Primary Concern', val: 'Throbbing headache & photophobia' },
                { label: 'AI Risk Rating', val: 'Mild / Moderate — Non-Urgent' },
                { label: 'Recommended Action', val: 'Hydration + Teleconsultation' }
            ]
        }
    },
    {
        id: 'doctor',
        title: 'Doctors',
        subtitle: 'Rapid clinical triage & EHR efficiency',
        icon: Stethoscope,
        badge: 'Clinical Precision',
        headline: 'Spend less time on charts, more time on care',
        description: 'Doctors receive pre-analyzed patient summaries with red-flag highlights, suggested differential considerations, and automated e-prescription drafting.',
        points: [
            'AI-summarized patient intake prior to consultation',
            'Red flag safety alerts for urgent clinical intervention',
            '1-click electronic prescriptions & lab order dispatch',
            'Full ABDM health record timeline history'
        ],
        previewCard: {
            title: 'Physician Workstation',
            status: 'Incoming Queue (3 Patients)',
            tag: 'Priority Sorted',
            details: [
                { label: 'Patient Triage Summary', val: 'Acute Right Upper Quadrant Pain' },
                { label: 'Vitals Alert', val: 'Temp 101.4°F • SpO2 97%' },
                { label: 'AI Differential', val: 'Acute Cholecystitis vs Gastritis' }
            ]
        }
    },
    {
        id: 'health_worker',
        title: 'Health Workers',
        subtitle: 'Frontline rural healthcare enablement',
        icon: HeartPulse,
        badge: 'Community & Rural Care',
        headline: 'Bridging the healthcare gap in remote areas',
        description: 'ASHA and ANM workers can conduct doorstep clinical triage, record vitals offline, and queue priority cases for remote doctor review.',
        points: [
            'Full offline capability for low-connectivity villages',
            'Voice-to-text intake in regional dialects',
            'Step-by-step clinical triage protocol checklists',
            'Automated referral queue to nearby clinic hubs'
        ],
        previewCard: {
            title: 'Community Field App',
            status: 'Offline Sync Ready (5 Queue)',
            tag: 'Village Outreach',
            details: [
                { label: 'Community Queue', val: '12 Screening Intakes Today' },
                { label: 'Connectivity', val: 'Offline Mode Active (Auto Sync)' },
                { label: 'Urgent Referrals', val: '1 High Priority Flagged' }
            ]
        }
    },
    {
        id: 'clinic_admin',
        title: 'Clinic Admins',
        subtitle: 'Unified clinic & resource intelligence',
        icon: Building2,
        badge: 'Operational Control',
        headline: 'Streamline patient flow & facility capacity',
        description: 'Manage clinic registrations, doctor duty rosters, triage throughput metrics, and ABDM compliance reporting from a centralized portal.',
        points: [
            'Real-time clinic waiting room & triage throughput tracking',
            'Doctor schedule & consultation room allocation',
            'ABDM M1, M2 & M3 registry management',
            'Analytics dashboard for patient volume & resource optimization'
        ],
        previewCard: {
            title: 'Facility Dashboard',
            status: 'Network Status: Optimal',
            tag: '4 Doctors Active',
            details: [
                { label: 'Avg Triage Wait Time', val: '4.2 Minutes' },
                { label: 'ABDM Sync Rate', val: '100% Interoperable' },
                { label: 'Daily Throughput', val: '142 Consultations Completed' }
            ]
        }
    }
];

export const RoleHighlightsSection = ({ onEnterPlatform }) => {
    const { t } = useLanguage();
    const [activeIdx, setActiveIdx] = useState(0);
    const active = ROLES[activeIdx];

    return (
        <section className="relative w-full py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto z-20">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3 mb-12 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: 'var(--accent)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    {t("03 — Multi-Role Ecosystem")}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    {t("Designed for everyone in the")} <br />
                    <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                        {t("care continuum.")}
                    </span>
                </h2>
                <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t("Whether you are a patient seeking rapid clarity or a physician managing high-volume intake, Sanjeevani adapts to your workflow.")}
                </p>
            </div>

            {/* Role Navigation Tabs */}
            <div className="flex items-center justify-center flex-wrap gap-3 mb-10">
                {ROLES.map((role, idx) => {
                    const isActive = activeIdx === idx;
                    const Icon = role.icon;
                    return (
                        <button
                            key={role.id}
                            onClick={() => setActiveIdx(idx)}
                            className="flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-black transition-all cursor-pointer shadow-2xs"
                            style={{
                                background: isActive ? 'var(--accent)' : 'var(--card-bg)',
                                color: isActive ? '#ffffff' : 'var(--text-primary)',
                                border: isActive ? '1px solid transparent' : '1px solid var(--border)',
                                transform: isActive ? 'translateY(-2px)' : 'none'
                            }}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{t(role.title)}</span>
                        </button>
                    );
                })}
            </div>

            {/* Role Content Grid */}
            <div
                className="w-full rounded-3xl p-8 md:p-12 backdrop-blur-xl transition-all duration-300 shadow-xs"
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                }}
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Column: Role Overview & Highlights */}
                    <div className="lg:col-span-7 flex flex-col items-start text-left gap-5">
                        <div className="flex items-center gap-2">
                            <span
                                className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border"
                                style={{
                                    color: 'var(--pastel-pink-text)',
                                    background: 'var(--pastel-pink-bg)',
                                    borderColor: 'var(--border)'
                                }}
                            >
                                {t(active.badge)}
                            </span>
                            <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-muted)' }}>
                                {t(active.subtitle)}
                            </span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {t(active.headline)}
                        </h3>

                        <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {t(active.description)}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                            {active.points.map((pt, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                                    <span>{t(pt)}</span>
                                </div>
                            ))}
                        </div>

                        {onEnterPlatform && (
                            <button
                                onClick={onEnterPlatform}
                                className="mt-4 px-6 py-3 rounded-full text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs"
                                style={{ background: 'var(--accent)' }}
                            >
                                <span>{t("Explore")} {t(active.title)}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Right Column: Live Mockup Card */}
                    <div className="lg:col-span-5 w-full">
                        <div
                            className="p-6 rounded-2xl flex flex-col gap-4 shadow-sm"
                            style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)'
                            }}
                        >
                            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent)' }} />
                                    <span className="text-xs font-black font-mono uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                                        {active.previewCard.title}
                                    </span>
                                </div>
                                <span
                                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                                    style={{
                                        color: 'var(--pastel-mint-text)',
                                        background: 'var(--pastel-mint-bg)',
                                        borderColor: 'var(--pastel-mint-text)'
                                    }}
                                >
                                    {active.previewCard.tag}
                                </span>
                            </div>

                            <div className="text-[11px] font-bold font-mono" style={{ color: 'var(--accent)' }}>
                                Status: {active.previewCard.status}
                            </div>

                            <div className="flex flex-col gap-2.5">
                                {active.previewCard.details.map((d, i) => (
                                    <div
                                        key={i}
                                        className="p-3 rounded-xl flex items-center justify-between text-xs font-medium"
                                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                                    >
                                        <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{d.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RoleHighlightsSection;
