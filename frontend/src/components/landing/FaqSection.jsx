import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/LanguageContext';

const FAQS = [
    {
        q: "How does Sanjeevani's AI triage system work?",
        a: "Sanjeevani uses natural language processing to listen or read symptoms described in plain language. It structures these symptoms into clinical categories, checks against red-flag rules, and suggests a risk severity score (Level 1 Emergency to Level 4 Non-Urgent) for physician review."
    },
    {
        q: "Is patient health data secure and ABDM compliant?",
        a: "Yes. Sanjeevani is built to comply with Ayushman Bharat Digital Mission (ABDM) standards (M1, M2, M3). All patient data is encrypted using AES-256 both in transit and at rest, maintaining strict data sovereignty and zero unauthorized access."
    },
    {
        q: "Can health workers use Sanjeevani offline in rural areas?",
        a: "Absolutely. Sanjeevani features a dedicated offline mode for ASHA and ANM frontline workers. Intakes and preliminary vitals recorded offline are saved locally on the device and automatically sync to the central clinic node once an internet connection is established."
    },
    {
        q: "Which languages are natively supported?",
        a: "Sanjeevani natively supports English, Hindi (हिन्दी), and Bengali (বাংলা) for both voice and text intake, allowing patients and health workers to describe symptoms naturally in their preferred language."
    },
    {
        q: "How do doctors receive and review patient triage summaries?",
        a: "Doctors have access to a dedicated clinical dashboard where incoming patients are sorted by triage urgency. Pre-parsed symptoms, vitals alerts, and AI differential suggestions appear before the patient enters, accelerating consultation efficiency."
    }
];

export const FaqSection = () => {
    const { t } = useLanguage();
    const [openIdx, setOpenIdx] = useState(0);

    const toggleFaq = (idx) => {
        setOpenIdx(openIdx === idx ? null : idx);
    };

    return (
        <section className="relative w-full py-16 md:py-24 px-6 md:px-12 max-w-4xl mx-auto z-20">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3 mb-12">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: 'var(--accent)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    {t("07 — Frequently Asked Questions")}
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    {t("Everything you need to know about")} <br />
                    <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                        {t("Sanjeevani Clinical Network.")}
                    </span>
                </h2>
            </div>

            {/* Accordion List */}
            <div className="flex flex-col gap-3">
                {FAQS.map((faq, idx) => {
                    const isOpen = openIdx === idx;
                    return (
                        <div
                            key={idx}
                            className="rounded-2xl border transition-all duration-200 overflow-hidden"
                            style={{
                                background: 'var(--card-bg)',
                                borderColor: isOpen ? 'var(--accent)' : 'var(--border)'
                            }}
                        >
                            <button
                                onClick={() => toggleFaq(idx)}
                                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base cursor-pointer"
                                style={{ color: 'var(--text-primary)' }}
                                aria-expanded={isOpen}
                            >
                                <span className="flex items-center gap-3">
                                    <HelpCircle className="w-4 h-4 shrink-0" style={{ color: isOpen ? 'var(--accent)' : 'var(--text-muted)' }} />
                                    <span>{t(faq.q)}</span>
                                </span>
                                <ChevronDown
                                    className="w-4 h-4 shrink-0 transition-transform duration-300"
                                    style={{
                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        color: 'var(--text-secondary)'
                                    }}
                                />
                            </button>

                            {isOpen && (
                                <div
                                    className="px-5 pb-5 pt-1 text-xs sm:text-sm font-medium leading-relaxed border-t"
                                    style={{
                                        color: 'var(--text-secondary)',
                                        borderColor: 'var(--border-subtle)'
                                    }}
                                >
                                    {t(faq.a)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default FaqSection;
