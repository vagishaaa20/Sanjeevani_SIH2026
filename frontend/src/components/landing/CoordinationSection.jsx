import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { User, Activity, Pill, CheckCircle2, ArrowRight } from 'lucide-react';

export const CoordinationSection = () => {
    const { ref, isVisible } = useScrollReveal(0.3);

    return (
        <section className="relative w-full py-24 md:py-32 px-6 max-w-6xl mx-auto z-20" ref={ref}>
            <div className="flex flex-col items-center mb-16 text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    Knowing what a patient needs <br />
                    <span className="font-serif italic font-normal text-emerald-500">
                        isn't enough.
                    </span>
                </h2>
                <p className="mt-4 text-sm md:text-base font-medium leading-relaxed max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                    Sanjeevani coordinates the entire fulfillment process—from sending diagnostic requests to clinics, to checking local medicine inventory before prescribing.
                </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
                {/* Connecting Lines Desktop */}
                <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-[var(--border)]" />
                <div className="hidden md:block absolute top-12 left-[20%] bottom-16 w-0.5 bg-[var(--border)]" />
                <div className="hidden md:block absolute top-12 right-[20%] bottom-16 w-0.5 bg-[var(--border)]" />

                <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                    
                    {/* Top Level: Patient */}
                    <div className="flex justify-center mb-12 relative z-10">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] border border-emerald-500/30 flex items-center justify-center shadow-md">
                                <User className="w-8 h-8 text-emerald-500" />
                            </div>
                            <span className="text-xs font-black tracking-widest uppercase mt-3">Patient Needs Care</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                        
                        {/* Branch 1: Diagnostics */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-3 px-6 py-3 rounded-full border bg-[var(--bg-primary)] mb-8 shadow-sm">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                <span className="font-bold text-sm">Diagnostics</span>
                            </div>
                            
                            <div className="w-full p-5 rounded-2xl border bg-[var(--card-bg)] shadow-sm space-y-4 text-left">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-muted)]">TEST REQUEST</span>
                                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">SENT</span>
                                </div>
                                <div className="flex justify-center my-2"><ArrowRight className="w-4 h-4 text-[var(--border)] rotate-90" /></div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-muted)]">RESULT</span>
                                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> ATTACHED</span>
                                </div>
                            </div>
                        </div>

                        {/* Branch 2: Medicines */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-3 px-6 py-3 rounded-full border bg-[var(--bg-primary)] mb-8 shadow-sm">
                                <Pill className="w-5 h-5 text-emerald-500" />
                                <span className="font-bold text-sm">Medicines</span>
                            </div>
                            
                            <div className="w-full p-5 rounded-2xl border bg-[var(--card-bg)] shadow-sm space-y-4 text-left">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-muted)]">AVAILABILITY</span>
                                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">IN STOCK</span>
                                </div>
                                <div className="flex justify-center my-2"><ArrowRight className="w-4 h-4 text-[var(--border)] rotate-90" /></div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-muted)]">DISPENSING</span>
                                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> READY</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default CoordinationSection;
