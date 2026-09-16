import React from 'react';
import { Quote, Star } from 'lucide-react';
import { useLanguage } from '../../hooks/LanguageContext';

const TESTIMONIALS = [
    {
        id: 'doc1',
        quote: "Sanjeevani's AI triage pre-summaries have transformed our clinic. I can review emergency red flags before stepping into the consultation room, saving critical minutes.",
        author: "Dr. Ananya Sharma",
        role: "Senior Physician & Medical Director",
        facility: "Metro Care Hospital",
        rating: 5
    },
    {
        id: 'worker1',
        quote: "Conducting health screenings in rural villages used to mean carrying stacks of paper. Now with offline triage in Bengali and Hindi, our field visits are twice as fast.",
        author: "Sunita Roy",
        role: "Lead Community Health Supervisor",
        facility: "District Rural Outreach Team",
        rating: 5
    },
    {
        id: 'admin1',
        quote: "The ABDM integration and automated prescription generation reduced our administrative overhead by over 40%. It's the most intuitive clinical software we have used.",
        author: "Rajesh K. Mehta",
        role: "Chief Operating Officer",
        facility: "Sanjeevani Clinic Network",
        rating: 5
    }
];

export const TestimonialsSection = () => {
    const { t } = useLanguage();

    return (
        <section className="relative w-full py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto z-20">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3 mb-12 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: 'var(--accent)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    {t("06 — Verified Clinical Proof")}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    {t("Trusted by healthcare leaders")} <br />
                    <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                        {t("across hospitals & field clinics.")}
                    </span>
                </h2>
                <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t("See how Sanjeevani empowers frontline care teams and improves patient outcomes every day.")}
                </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((item) => (
                    <div
                        key={item.id}
                        className="p-8 rounded-3xl backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            boxShadow: '0 4px 20px -4px rgba(225, 59, 104, 0.05)'
                        }}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                >
                                    <Quote className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(item.rating)].map((_, i) => (
                                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs md:text-sm font-medium leading-relaxed mb-6 italic" style={{ color: 'var(--text-primary)' }}>
                                "{t(item.quote)}"
                            </p>
                        </div>

                        <div className="pt-4 border-t flex flex-col gap-0.5" style={{ borderColor: 'var(--border-subtle)' }}>
                            <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                                {item.author}
                            </span>
                            <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                                {t(item.role)}
                            </span>
                            <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--text-muted)' }}>
                                {t(item.facility)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TestimonialsSection;
