import React from 'react';
import { ArrowDown, Files, Building, RotateCcw, Clock, Target, AlertTriangle } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

export const ProblemStatement = () => {
    const { ref: containerRef, isVisible } = useScrollReveal(0.2);

    return (
        <section className="relative w-full py-16 md:py-20 px-6 overflow-hidden flex flex-col items-center justify-center z-10">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at center, var(--accent-light) 0%, transparent 70%)' }} />

            <div ref={containerRef} className="max-w-4xl mx-auto w-full flex flex-col items-center">
                {/* Headline */}
                <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black text-center mb-16 tracking-tight leading-tight transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ color: 'var(--text-primary)' }}>
                    A patient's journey shouldn't feel like a <span className="font-serif italic text-rose-500">maze.</span>
                </h2>

                {/* The fragmented journey */}
                <div className={`relative flex flex-col items-center w-full max-w-lg mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    
                    {/* Central Line connecting fragments */}
                    <div className={`absolute top-0 bottom-0 w-0.5 left-1/2 -translate-x-1/2 transition-all duration-[2s] ease-in-out ${isVisible ? 'h-full bg-rose-500/30' : 'h-0 bg-transparent'}`} />

                    <FragmentItem icon={Files} label="Paper records" delay={500} isVisible={isVisible} />
                    <ConnectionArrow delay={700} isVisible={isVisible} />
                    <FragmentItem icon={Building} label="Different facilities" delay={900} isVisible={isVisible} />
                    <ConnectionArrow delay={1100} isVisible={isVisible} />
                    <FragmentItem icon={RotateCcw} label="Repeated history" delay={1300} isVisible={isVisible} />
                    <ConnectionArrow delay={1500} isVisible={isVisible} />
                    <FragmentItem icon={Clock} label="Delayed referrals" delay={1700} isVisible={isVisible} />
                    <ConnectionArrow delay={1900} isVisible={isVisible} />
                    <FragmentItem icon={AlertTriangle} label="Missing diagnostics" delay={2100} isVisible={isVisible} />

                </div>

                {/* The Resolution */}
                <div className={`mt-24 text-center transition-all duration-1000 delay-[2500ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                    <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)]">
                        <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        One connected journey.
                    </h3>
                </div>
            </div>
        </section>
    );
};

const FragmentItem = ({ icon: Icon, label, delay, isVisible }) => (
    <div 
        className={`relative z-10 flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-md transition-all duration-700 w-64 sm:w-80 shadow-sm
            ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
        style={{ 
            background: 'var(--card-bg)', 
            borderColor: 'var(--border)',
            transitionDelay: `${delay}ms`
        }}
    >
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500 shrink-0">
            <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-sm sm:text-base text-[var(--text-secondary)]">{label}</span>
    </div>
);

const ConnectionArrow = ({ delay, isVisible }) => (
    <div 
        className={`relative z-10 my-4 transition-all duration-500
            ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDelay: `${delay}ms` }}
    >
        <ArrowDown className="w-5 h-5 text-rose-300" />
    </div>
);

export default ProblemStatement;
