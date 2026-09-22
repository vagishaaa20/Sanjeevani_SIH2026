import React, { useState } from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { Activity, Bot, MapPin, Stethoscope, FileSearch, RotateCcw, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

// Helper icon
function Building2Icon(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>;
}

const STEPS = [
    {
        id: '01',
        title: "FIELD ASSESSMENT",
        icon: Activity,
        color: "rose",
        mockup: (
            <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>PATIENT ASSESSMENT</span>
                    <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full font-bold">OFFLINE MODE</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Persistent fever</div>
                    <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Skin rash</div>
                    <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Fatigue</div>
                </div>
                <div className="mt-2 text-xs font-mono p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                    Duration: 5 days
                </div>
            </div>
        )
    },
    {
        id: '02',
        title: "AI TRIAGE",
        icon: Bot,
        color: "purple",
        mockup: (
            <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>AI PROCESSING</span>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Risk Assessment:</span>
                        <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> HIGH</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-500">Recommended Action:</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Doctor consultation</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: '03',
        title: "CARE ROUTING",
        icon: MapPin,
        color: "blue",
        mockup: (
            <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>FACILITY ROUTING</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-sm font-bold">Patient Location</span>
                </div>
                <div className="w-0.5 h-6 bg-border ml-1" style={{ background: 'var(--border)' }} />
                <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5">
                    <Building2Icon className="w-5 h-5 text-blue-500" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-500">ASSIGNED CLINIC</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>District Health Center</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: '04',
        title: "DOCTOR REVIEW",
        icon: Stethoscope,
        color: "teal",
        mockup: (
            <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>PRE-CONSULTATION</span>
                </div>
                <div className="p-3 rounded-lg flex flex-col gap-2" style={{ background: 'var(--bg-surface)' }}>
                    <span className="text-xs font-mono text-teal-500">AI SUMMARY</span>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Patient presents with persistent fever and rash. High priority due to prolonged duration.
                    </p>
                </div>
            </div>
        )
    }
];

export const WorkflowSection = () => {
    const { ref, isVisible } = useScrollReveal(0.2);
    const [activeStep, setActiveStep] = useState(0);

    return (
        <section className="relative w-full py-24 md:py-32 px-6 max-w-7xl mx-auto z-20" ref={ref}>
            <div className="flex flex-col items-center mb-16 text-center">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                    From first symptom <br className="hidden md:block" /> to continuous care.
                </h2>
            </div>

            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                
                {/* Desktop Horizontal Workflow */}
                <div className="hidden lg:grid grid-cols-4 gap-4">
                    {STEPS.map((step, idx) => (
                        <div 
                            key={step.id}
                            className={`relative p-6 rounded-3xl border transition-all duration-500 cursor-pointer
                                ${activeStep === idx ? 'shadow-xl scale-105 z-10' : 'opacity-70 scale-95 hover:opacity-100 hover:scale-100 z-0'}
                            `}
                            style={{ 
                                background: 'var(--card-bg)',
                                borderColor: activeStep === idx ? `var(--accent)` : 'var(--border)'
                            }}
                            onClick={() => setActiveStep(idx)}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-xs font-black opacity-40">{step.id}</span>
                                <span className="text-xs font-black tracking-wider">{step.title}</span>
                            </div>
                            
                            <div className="h-64 flex flex-col justify-center">
                                {step.mockup}
                            </div>
                            
                            {/* Connective arrow for active state (except last) */}
                            {activeStep === idx && idx < STEPS.length - 1 && (
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-20">
                                    <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                                        <ChevronRight className="w-4 h-4 text-rose-500" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile Vertical Workflow */}
                <div className="flex lg:hidden flex-col gap-6 relative">
                    <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-border" style={{ background: 'var(--border)' }} />
                    
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="relative pl-16">
                            <div className="absolute left-3 top-6 -translate-x-1/2 w-6 h-6 rounded-full border-4 flex items-center justify-center bg-[var(--bg-primary)]" style={{ borderColor: 'var(--accent)' }}>
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                            </div>
                            
                            <div className="p-5 rounded-2xl border shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                                <div className="text-xs font-black tracking-wider mb-4 opacity-70">
                                    {step.id} — {step.title}
                                </div>
                                <div>
                                    {step.mockup}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WorkflowSection;
