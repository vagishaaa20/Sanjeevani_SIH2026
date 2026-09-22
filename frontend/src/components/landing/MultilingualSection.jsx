import React, { useState, useEffect } from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import { Globe, MessageSquare } from 'lucide-react';

const TRANSLATIONS = [
    { lang: 'English', text: "Tell me about your symptoms." },
    { lang: 'हिन्दी', text: "अपने लक्षणों के बारे में बताइए।" },
    { lang: 'বাংলা', text: "আপনার উপসর্গ সম্পর্কে বলুন।" }
];

export const MultilingualSection = () => {
    const { ref, isVisible } = useScrollReveal(0.3);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % TRANSLATIONS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isVisible]);

    return (
        <section className="relative w-full py-24 md:py-32 px-6 max-w-4xl mx-auto z-20 text-center" ref={ref}>
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border shadow-sm flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                    <Globe className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                </div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12] mb-12" style={{ color: 'var(--text-primary)' }}>
                Healthcare speaks <span className="font-serif italic font-normal text-indigo-500">your language.</span>
            </h2>

            <div className="relative h-32 flex items-center justify-center overflow-hidden">
                {TRANSLATIONS.map((trans, idx) => {
                    const isActive = currentIndex === idx;
                    const isPrev = currentIndex === (idx + 1) % TRANSLATIONS.length;
                    
                    let yOffset = 'translate-y-12';
                    let opacity = 'opacity-0';
                    let scale = 'scale-95';

                    if (isActive) {
                        yOffset = 'translate-y-0';
                        opacity = 'opacity-100';
                        scale = 'scale-100';
                    } else if (isPrev) {
                        yOffset = '-translate-y-12';
                        opacity = 'opacity-0';
                        scale = 'scale-95';
                    }

                    return (
                        <div 
                            key={trans.lang}
                            className={`absolute flex flex-col items-center transition-all duration-700 ease-in-out ${yOffset} ${opacity} ${scale}`}
                        >
                            <span className="text-xs font-black tracking-widest uppercase mb-3 text-indigo-500">
                                {trans.lang}
                            </span>
                            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[var(--bg-surface)] border shadow-md" style={{ borderColor: 'var(--border)' }}>
                                <MessageSquare className="w-5 h-5 text-indigo-400" />
                                <span className="text-lg md:text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                                    "{trans.text}"
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default MultilingualSection;
