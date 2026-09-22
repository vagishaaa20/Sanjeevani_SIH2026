import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import BiomolecularOrb3D from './BiomolecularOrb3D';
import { Layers } from 'lucide-react';

export const TechnologyStack = () => {
    const { ref, isVisible } = useScrollReveal(0.2);

    return (
        <section className="relative w-full py-16 md:py-24 px-6 flex items-center justify-center overflow-hidden z-20" ref={ref}>
            
            {/* 3D Background */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none flex items-center justify-center">
                <div className="w-full h-full max-w-4xl max-h-[800px]">
                    <BiomolecularOrb3D />
                </div>
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center">
                
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono text-[var(--accent)] mb-6">
                    <Layers className="w-4 h-4" />
                    Architecture
                </div>
                
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] mb-24" style={{ color: 'var(--text-primary)' }}>
                    Intelligence behind <br />
                    <span className="font-serif italic font-normal text-rose-500">
                        the care journey.
                    </span>
                </h2>

                <div className="flex flex-col gap-12 w-full max-w-2xl">
                    
                    {/* Layer 1 */}
                    <div className={`p-6 md:p-8 rounded-3xl border backdrop-blur-xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <h3 className="text-xs font-black tracking-widest uppercase mb-4 text-[var(--text-muted)]">EXPERIENCE</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Badge label="Patient" />
                            <Badge label="Health Worker" />
                            <Badge label="Doctor" />
                            <Badge label="Clinic" />
                        </div>
                    </div>

                    {/* Layer 2 */}
                    <div className={`p-6 md:p-8 rounded-3xl border backdrop-blur-xl transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ background: 'var(--card-bg)', borderColor: 'var(--accent)' }}>
                        <h3 className="text-xs font-black tracking-widest uppercase mb-4 text-[var(--accent)]">INTELLIGENCE</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Badge label="AI Triage" highlight />
                            <Badge label="Risk Identification" highlight />
                            <Badge label="Care Routing" highlight />
                        </div>
                    </div>

                    {/* Layer 3 */}
                    <div className={`p-6 md:p-8 rounded-3xl border backdrop-blur-xl transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <h3 className="text-xs font-black tracking-widest uppercase mb-4 text-[var(--text-muted)]">CARE INFRASTRUCTURE</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Badge label="Health Records" />
                            <Badge label="Referrals" />
                            <Badge label="Diagnostics" />
                            <Badge label="Follow-ups" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

const Badge = ({ label, highlight }) => (
    <span className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold border transition-colors ${highlight ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)]'}`}>
        {label}
    </span>
);

export default TechnologyStack;
