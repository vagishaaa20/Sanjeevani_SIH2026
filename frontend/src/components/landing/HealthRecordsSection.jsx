import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { Pill, Activity, ShieldCheck, FileCheck, Calendar, ArrowDown } from 'lucide-react';

const TIMELINE_EVENTS = [
    { date: '2026', type: 'Consultation', desc: 'Initial triage & physician review.', icon: Calendar },
    { date: '2026', type: 'Diagnostic Report', desc: 'CBC & Lipid panel results attached.', icon: Activity },
    { date: '2026', type: 'Prescription', desc: 'Standardized medication plan.', icon: Pill },
    { date: '2026', type: 'Referral', desc: 'Specialist coordination.', icon: ShieldCheck },
];

export const HealthRecordsSection = () => {
    const { ref, isVisible } = useScrollReveal(0.2);

    return (
        <section className="relative w-full py-24 md:py-32 px-6 max-w-5xl mx-auto z-20" ref={ref}>
            <div className="flex flex-col items-center mb-16 text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    Your health history shouldn't <br />
                    <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                        reset at every door.
                    </span>
                </h2>
                <p className="mt-4 text-sm md:text-base font-medium leading-relaxed max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                    Every interaction across the Sanjeevani ecosystem builds a single, continuous, and highly secure longitudinal health record.
                </p>
            </div>

            {/* Timeline */}
            <div className="relative flex flex-col items-center max-w-2xl mx-auto">
                {/* Central Line */}
                <div className={`absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500/20 via-teal-500/40 to-teal-500/20 transition-all duration-[2s] ${isVisible ? 'scale-y-100' : 'scale-y-0'} origin-top`} />

                {TIMELINE_EVENTS.map((event, idx) => (
                    <div 
                        key={idx} 
                        className={`relative w-full flex items-center justify-between mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: `${idx * 300}ms` }}
                    >
                        {/* Left Side (Empty for staggering, or used on desktop) */}
                        <div className="hidden md:flex flex-1 justify-end pr-8 text-right">
                            {idx % 2 === 0 && (
                                <div>
                                    <span className="text-xs font-black tracking-wider text-teal-500">{event.date}</span>
                                    <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{event.type}</h4>
                                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{event.desc}</p>
                                </div>
                            )}
                        </div>

                        {/* Center Node */}
                        <div className="relative z-10 w-12 h-12 rounded-full border-2 bg-[var(--bg-surface)] flex items-center justify-center shrink-0 shadow-md"
                             style={{ borderColor: 'var(--border)' }}>
                            <event.icon className="w-5 h-5 text-teal-500" />
                            {/* Pulse */}
                            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-teal-500" style={{ animationDuration: '3s', animationDelay: `${idx * 0.5}s` }} />
                        </div>

                        {/* Right Side */}
                        <div className="flex-1 pl-6 md:pl-8">
                            <div className={`md:${idx % 2 === 0 ? 'hidden' : 'block'}`}>
                                <span className="text-xs font-black tracking-wider text-teal-500">{event.date}</span>
                                <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{event.type}</h4>
                                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{event.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`mt-16 text-center transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <h3 className="text-2xl font-black tracking-tight text-teal-600">
                    One patient. <br className="md:hidden" /> One continuous story.
                </h3>
            </div>
        </section>
    );
};

export default HealthRecordsSection;
