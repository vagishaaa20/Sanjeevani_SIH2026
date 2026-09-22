import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { AlertTriangle, Activity, Stethoscope, CornerDownRight, CheckCircle2 } from 'lucide-react';

const LIFECYCLE_STEPS = [
    { id: 'identified', label: 'IDENTIFIED', icon: AlertTriangle, desc: "AI flags severe symptoms." },
    { id: 'monitoring', label: 'MONITORING', icon: Activity, desc: "Health worker assigned." },
    { id: 'escalated', label: 'ESCALATED', icon: Stethoscope, desc: "Doctor intervention required." },
    { id: 'resolved', label: 'RESOLVED', icon: CheckCircle2, desc: "Patient stabilized." },
];

export const HighRiskSection = () => {
    const { ref, isVisible } = useScrollReveal(0.2);

    return (
        <section className="relative w-full py-24 md:py-32 px-6 max-w-6xl mx-auto z-20" ref={ref}>
            <div className="flex flex-col md:flex-row gap-12 items-center justify-between">
                
                {/* Left Text */}
                <div className="flex flex-col items-start gap-4 max-w-md">
                    <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        Critical Care
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                        Some patients need <br />
                        <span className="font-serif italic font-normal text-red-500">
                            more than one visit.
                        </span>
                    </h2>
                    <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        When a patient is identified as high-risk, Sanjeevani automatically escalates their profile, assigning a dedicated health worker and monitoring their status until resolution.
                    </p>
                </div>

                {/* Right Lifecycle */}
                <div className={`flex-1 w-full relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                    <div className="flex flex-col gap-4">
                        {LIFECYCLE_STEPS.map((step, idx) => (
                            <div key={step.id} className="relative flex items-center gap-6">
                                {/* Connecting Line */}
                                {idx < LIFECYCLE_STEPS.length - 1 && (
                                    <div className="absolute left-6 top-12 bottom-[-16px] w-0.5 bg-red-500/20" />
                                )}
                                
                                {/* Icon */}
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-surface)] border border-red-500/30 text-red-500 relative z-10 shadow-sm">
                                    <step.icon className="w-5 h-5" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 p-4 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                                    <span className="text-xs font-black tracking-wider text-red-500">{step.label}</span>
                                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default HighRiskSection;
