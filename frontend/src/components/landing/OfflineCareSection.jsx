import React, { useState, useEffect } from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { WifiOff, Wifi, CloudUpload, CheckCircle, Database } from 'lucide-react';

export const OfflineCareSection = () => {
    const { ref, isVisible } = useScrollReveal(0.5, false); // Re-trigger on scroll for demo
    const [syncState, setSyncState] = useState('offline'); // 'offline', 'syncing', 'complete'

    useEffect(() => {
        if (isVisible) {
            setSyncState('offline');
            const t1 = setTimeout(() => setSyncState('syncing'), 2500);
            const t2 = setTimeout(() => setSyncState('complete'), 4500);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [isVisible]);

    return (
        <section className="relative w-full py-24 md:py-32 px-6 max-w-6xl mx-auto z-20" ref={ref}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                
                {/* Left Text */}
                <div className="flex flex-col items-start gap-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                        Care shouldn't stop when the <span className="font-serif italic font-normal text-amber-500">signal does.</span>
                    </h2>
                    <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Health workers operate in remote areas where connectivity is unreliable. Sanjeevani's offline-first architecture ensures that field triage, symptom collection, and notes are securely cached and automatically synchronized the moment a connection is restored.
                    </p>
                </div>

                {/* Right Interactive Visual */}
                <div className="relative w-full h-[300px] flex items-center justify-center bg-[var(--bg-surface)] rounded-3xl border shadow-inner overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    {/* Central Device Mockup */}
                    <div className="relative z-10 w-64 p-5 rounded-2xl border shadow-xl bg-[var(--card-bg)] flex flex-col items-center transition-all duration-500"
                         style={{ borderColor: syncState === 'offline' ? 'var(--border)' : (syncState === 'syncing' ? 'var(--accent)' : '#10b981') }}>
                        
                        {/* Status Icon */}
                        <div className="h-12 flex items-center justify-center mb-4 transition-all duration-300">
                            {syncState === 'offline' && <WifiOff className="w-8 h-8 text-amber-500 animate-pulse" />}
                            {syncState === 'syncing' && <CloudUpload className="w-8 h-8 text-blue-500 animate-bounce" />}
                            {syncState === 'complete' && <CheckCircle className="w-8 h-8 text-emerald-500" />}
                        </div>

                        {/* Status Text */}
                        <h4 className="text-sm font-black tracking-widest uppercase mb-4 transition-colors"
                            style={{ color: syncState === 'offline' ? '#f59e0b' : (syncState === 'syncing' ? '#3b82f6' : '#10b981') }}>
                            {syncState === 'offline' ? 'OFFLINE MODE' : (syncState === 'syncing' ? 'SYNCING...' : 'SYNC COMPLETE')}
                        </h4>

                        {/* Data list */}
                        <div className="w-full space-y-2 opacity-80">
                            <DataItem label="Patient assessment" status={syncState} />
                            <DataItem label="Vitals & Symptoms" status={syncState} />
                            <DataItem label="Follow-up notes" status={syncState} />
                        </div>
                    </div>

                    {/* Server Node (Sync Target) */}
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700 ${syncState !== 'offline' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center shadow-md">
                            <Database className={`w-5 h-5 ${syncState === 'complete' ? 'text-emerald-500' : 'text-blue-500'}`} />
                        </div>
                        <span className="text-[10px] font-black uppercase mt-2 text-[var(--text-muted)]">Central System</span>
                    </div>

                    {/* Data Particles (Syncing) */}
                    {syncState === 'syncing' && (
                        <div className="absolute left-[50%] right-12 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden">
                            <div className="w-4 h-full bg-blue-500/50 blur-sm rounded-full animate-[slideRight_1s_linear_infinite]" />
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes slideRight {
                    0% { transform: translateX(-20px); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(150px); opacity: 0; }
                }
            `}} />
        </section>
    );
};

const DataItem = ({ label, status }) => (
    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {status === 'offline' ? (
            <div className="w-3 h-3 rounded-full border border-amber-500 flex items-center justify-center"><div className="w-1 h-1 bg-amber-500 rounded-full" /></div>
        ) : status === 'syncing' ? (
            <div className="w-3 h-3 rounded-full border-t-2 border-blue-500 animate-spin" />
        ) : (
            <CheckCircle className="w-3 h-3 text-emerald-500" />
        )}
        {label}
    </div>
);

export default OfflineCareSection;
