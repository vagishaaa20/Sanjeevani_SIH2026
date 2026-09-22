import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { User, Activity, Bot, Building2, Stethoscope, FileSearch, RotateCcw } from 'lucide-react';

const JOURNEY_NODES = [
    { id: 'patient', icon: User, label: "PATIENT", desc: "Describes symptoms and receives care guidance." },
    { id: 'worker', icon: Activity, label: "HEALTH WORKER", desc: "Collects information in the field, even offline." },
    { id: 'ai', icon: Bot, label: "AI TRIAGE", desc: "Structures symptoms and identifies urgency." },
    { id: 'clinic', icon: Building2, label: "CLINIC", desc: "Coordinates care and diagnostics." },
    { id: 'doctor', icon: Stethoscope, label: "DOCTOR", desc: "Reviews patient history and AI summary." },
    { id: 'diagnostics', icon: FileSearch, label: "DIAGNOSTICS", desc: "Coordinates tests and results." },
    { id: 'followup', icon: RotateCcw, label: "FOLLOW-UP", desc: "Ensures the patient doesn't disappear." }
];

export const ConnectedJourney = () => {
    const { ref, isVisible } = useScrollReveal(0.1);

    return (
        <section className="relative w-full py-16 md:py-24 px-6 max-w-7xl mx-auto z-20" ref={ref}>
            <div className="flex flex-col items-center mb-20 text-center">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                    One <span className="text-rose-500 italic font-serif font-normal">connected</span> journey.
                </h2>
                <p className="mt-4 text-lg font-medium max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                    From the first symptom to continuous care, data flows seamlessly to the right person at the right time.
                </p>
            </div>

            <div className="relative flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mx-auto">
                {/* Connection Line Background */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 md:left-0 md:right-0 md:top-1/2 md:h-0.5 md:w-full -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2" style={{ background: 'var(--border)' }} />

                {/* Animated Glowing Particle Line (Fills on scroll) */}
                <div 
                    className="absolute top-0 left-1/2 w-0.5 md:left-0 md:top-1/2 md:h-0.5 md:w-full -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 bg-gradient-to-b md:bg-gradient-to-r from-rose-500 to-rose-300 transition-all duration-[2000ms] ease-out origin-top md:origin-left" 
                    style={{ 
                        transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                        '@media (min-width: 768px)': {
                            transform: isVisible ? 'scaleX(1)' : 'scaleX(0)'
                        }
                    }} 
                />

                {JOURNEY_NODES.map((node, idx) => (
                    <JourneyNode 
                        key={node.id}
                        icon={node.icon}
                        label={node.label}
                        desc={node.desc}
                        index={idx}
                        isVisible={isVisible}
                    />
                ))}
            </div>
        </section>
    );
};

const JourneyNode = ({ icon: Icon, label, desc, index, isVisible }) => (
    <div 
        className="relative z-10 flex flex-col items-center group mb-12 md:mb-0"
        style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: `all 600ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 250}ms`
        }}
    >
        {/* Node Icon */}
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 bg-[var(--bg-primary)] transition-transform duration-300 group-hover:scale-110 shadow-lg relative"
            style={{ borderColor: isVisible ? 'var(--accent)' : 'var(--border)' }}>
            
            <Icon className="w-6 h-6 md:w-7 md:h-7 transition-colors duration-300" style={{ color: isVisible ? 'var(--accent)' : 'var(--text-muted)' }} />
            
            {/* Hover Glow */}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md pointer-events-none"
                style={{ background: 'var(--accent-light)' }} />
        </div>

        {/* Content */}
        <div className="text-center mt-4 absolute top-full w-48 hidden md:flex flex-col items-center">
            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>{label}</span>
            <span className="text-[11px] font-medium mt-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: 'var(--text-secondary)' }}>{desc}</span>
        </div>
        
        {/* Mobile Content */}
        <div className="text-center mt-3 md:hidden flex flex-col items-center w-48">
            <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>{label}</span>
            <span className="text-[11px] font-medium mt-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>{desc}</span>
        </div>
    </div>
);

export default ConnectedJourney;
