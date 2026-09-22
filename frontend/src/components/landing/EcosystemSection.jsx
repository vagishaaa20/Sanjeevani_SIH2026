import React from 'react';
import { HeartPulse, Stethoscope, Activity, Building, ShieldCheck } from 'lucide-react';
import FeatureCard from './FeatureCard';

const ECOSYSTEM_FEATURES = [
    {
        icon: HeartPulse,
        title: "For Patients",
        description: "Your comprehensive digital health vault. Book appointments, manage records, and access personalized AI-assisted care pathways securely.",
        benefits: ["Symptom Triage", "Diagnostic Requests", "Health Vault"]
    },
    {
        icon: Activity,
        title: "For Health Workers",
        description: "Empowering frontline care. Conduct mobile field triage, collect symptoms offline, and connect patients to the right clinical resources.",
        benefits: ["Mobile Triage", "Offline Mode", "Patient Assignment"]
    },
    {
        icon: Stethoscope,
        title: "For Doctors",
        description: "Intelligent clinical insights. Review AI-triaged patient histories, monitor high-risk individuals, and streamline consultations.",
        benefits: ["AI Pre-Consultation", "High-Risk Tracking", "Prescription Gen"]
    },
    {
        icon: Building,
        title: "For Clinics",
        description: "End-to-end administration. Manage medical inventory, oversee staff, and optimize the flow of triaged patients to available resources.",
        benefits: ["Inventory Control", "Staff Management", "Analytics"]
    }
];

export const EcosystemSection = () => {
    return (
        <section className="relative w-full py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto z-20">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3 mb-16 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
                    One system. <br />
                    <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                        Every handoff.
                    </span>
                </h2>
                <p className="text-sm md:text-base font-medium leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
                    A unified architecture seamlessly connecting every stakeholder in the healthcare journey—from rural field triage to urban clinical analysis.
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ECOSYSTEM_FEATURES.map((feature, idx) => (
                    <FeatureCard 
                        key={idx}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        benefits={feature.benefits}
                    />
                ))}
            </div>
        </section>
    );
};

export default EcosystemSection;
