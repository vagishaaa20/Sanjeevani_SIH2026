import React, { useState } from 'react';
import { Activity, ShieldCheck, ArrowRight, Check } from 'lucide-react';

const TRIAGE_CHIPS = [
    {
        id: 'fever',
        label: 'Persistent Fever',
        patientQuery: "Fever of 100.2°F for 3 days with dry cough.",
        triageSummary: "Mild upper-respiratory viral syndrome.",
        level: 'Non-Urgent • Level 4',
        markers: ['SpO2: 98% Normal', 'No respiratory distress', 'Hydration indicated']
    },
    {
        id: 'allergy',
        label: 'Skin Rash & Itching',
        patientQuery: "Localized red rash on forearm after gardening yesterday.",
        triageSummary: "Localized contact dermatitis reaction.",
        level: 'Mild Reaction',
        markers: ['No systemic involvement', 'Airway clear', 'Topical care recommended']
    },
    {
        id: 'migraine',
        label: 'Throbbing Headache',
        patientQuery: "Unilateral throbbing headache with mild light sensitivity.",
        triageSummary: "Episodic tension/migraine pattern.",
        level: 'Moderate Care',
        markers: ['No acute red flags', 'Photophobia noted', 'Rest protocol active']
    }
];

export const UnderstandSection = ({ onEnterPlatform }) => {
    const [activeIdx, setActiveIdx] = useState(0);
    const active = TRIAGE_CHIPS[activeIdx];

    return (
        <section className="relative w-full py-16 md:py-24 px-6 md:px-12 max-w-6xl mx-auto z-20">
            {/* Header with minimal, confident copy */}
            <div className="flex flex-col items-start gap-3 mb-10 max-w-xl">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-[#e13b68] uppercase font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e13b68]" />
                    02 — Intelligent Intake
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1c1218] tracking-tight leading-[1.12]">
                    Clinical triage, <br />
                    <span className="font-serif italic font-normal text-[#c4325c]">
                        structured in seconds.
                    </span>
                </h2>
                <p className="text-sm md:text-base text-[#7d6974] font-medium leading-relaxed">
                    Select a concern below to see how Sanjeevani translates symptoms into structured clinical context.
                </p>
            </div>

            {/* Interactive Symptom Chips */}
            <div className="flex flex-wrap gap-2.5 mb-8">
                {TRIAGE_CHIPS.map((chip, idx) => (
                    <button
                        key={chip.id}
                        onClick={() => setActiveIdx(idx)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            activeIdx === idx
                                ? 'bg-[#1c1218] text-white shadow-xs'
                                : 'bg-white/80 hover:bg-white text-[#5c4b54] border border-[#f2dde5]'
                        }`}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            {/* Interactive Preview Canvas */}
            <div className="w-full bg-white/90 backdrop-blur-xl border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Patient Input Box */}
                    <div className="md:col-span-6 flex flex-col gap-3">
                        <span className="text-[11px] font-mono font-bold text-[#8f7d87] uppercase tracking-wider">
                            Patient Description
                        </span>
                        <div className="bg-[#fff9fb] border border-[#f5e4ec] rounded-2xl p-4 text-sm font-medium text-[#1c1218] leading-relaxed">
                            "{active.patientQuery}"
                        </div>
                    </div>

                    {/* Structured Clinical Output */}
                    <div className="md:col-span-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-[#8f7d87] uppercase tracking-wider">
                                Structured Output
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {active.level}
                            </span>
                        </div>

                        <div className="bg-[#fffcfd] border border-[#f2dde5] rounded-2xl p-4 flex flex-col gap-3">
                            <div className="text-xs sm:text-sm font-bold text-[#1c1218]">
                                {active.triageSummary}
                            </div>
                            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#faeef2]">
                                {active.markers.map((m, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-[#5c4b54] font-medium">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>{m}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[#faeef2] flex items-center justify-between">
                    <span className="text-xs text-[#8f7d87]">Available across English, हिन्दी & বাংলা</span>
                    <button
                        onClick={onEnterPlatform}
                        className="text-xs font-bold text-[#e13b68] hover:text-[#c4325c] flex items-center gap-1.5 transition cursor-pointer"
                    >
                        <span>Experience Full Triage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default UnderstandSection;
