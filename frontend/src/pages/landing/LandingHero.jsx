import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Heart, Globe } from 'lucide-react';
import DnaHelix3D from '../../components/landing/DnaHelix3D';
import ShaderAtmosphere from '../../components/landing/ShaderAtmosphere';
import MagneticButton from '../../components/landing/MagneticButton';
import UnderstandSection from '../../components/landing/UnderstandSection';
import HealthRecordsSection from '../../components/landing/HealthRecordsSection';
import ReturnDnaSection from '../../components/landing/ReturnDnaSection';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/LanguageContext';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';

export const LandingHero = () => {
    const { user } = useAuth();
    const { currentLang, setCurrentLang } = useLanguage();
    const navigate = useNavigate();
    const understandSectionRef = useRef(null);

    const handleEnter = () => {
        if (!user) {
            navigate('/login');
        } else if (user.role === 'doctor') {
            navigate('/doctor/dashboard');
        } else if (user.role === 'clinic_admin') {
            navigate('/clinic/profile');
        } else if (user.role === 'health_worker') {
            navigate('/health-worker/dashboard');
        } else if (user.role === 'admin') {
            navigate('/admin/clinics');
        } else {
            navigate('/patient/dashboard');
        }
    };

    const scrollToUnderstand = () => {
        understandSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="relative min-h-screen w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,225,235,0.55),rgba(255,252,254,0.95))] text-[#1c1218] overflow-x-hidden flex flex-col selection:bg-[#fce4ec] selection:text-[#d93864]">
            {/* Ambient WebGL Shader Mist & Depth */}
            <ShaderAtmosphere />

            {/* Sticky Editorial Top Navigation */}
            <header className="sticky top-0 z-40 w-full bg-[#fffcfd]/85 backdrop-blur-md border-b border-[#fbf1f5]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
                    {/* Brand Mark */}
                    <Link
                        to="/"
                        className="flex items-center gap-3 text-lg font-black tracking-tight text-[#1c1218] group"
                    >
                        <div className="w-9 h-9 rounded-2xl bg-white border border-[#f5c6d6] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform p-1">
                            <SanjeevaniLogo variant="emblem" size={28} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-heading tracking-tight font-black text-xl leading-none">SANJEEVANI</span>
                            <span className="text-[9px] font-bold text-[#e13b68] tracking-widest uppercase mt-0.5">Intelligent Clinical Platform</span>
                        </div>
                    </Link>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 md:gap-5">
                        {/* Language Switcher */}
                        <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md border border-[#f5e4ec] hover:border-[#f8c8d8] rounded-full px-3 py-1.5 text-xs font-bold text-[#1c1218] transition">
                            <Globe className="w-3.5 h-3.5 text-[#e13b68]" />
                            <select
                                value={currentLang}
                                onChange={(e) => setCurrentLang(e.target.value)}
                                className="bg-transparent focus:outline-none cursor-pointer font-bold pr-1 text-[#1c1218]"
                                aria-label="Select Language"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिन्दी</option>
                                <option value="bn">বাংলা</option>
                            </select>
                        </div>

                        {user ? (
                            <button
                                onClick={handleEnter}
                                className="px-5 py-2 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-black transition shadow-xs cursor-pointer"
                            >
                                Dashboard →
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="text-xs font-bold text-[#1c1218] hover:text-[#e13b68] transition"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-black transition shadow-xs"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* 01 — HERO COMPOSITION */}
            <main className="relative z-20 min-h-[calc(100vh-80px)] w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8 md:py-16">
                {/* Left Column: Refined Editorial Typography & CTAs (6 cols) */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left gap-6 md:gap-7 pt-4 lg:pt-0">
                    {/* Minimal Eyebrow */}
                    <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-[#e13b68] uppercase font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e13b68]" />
                        01 — Sanjeevani
                    </div>

                    {/* Editorial Headline */}
                    <div className="flex flex-col">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-black leading-[1.04] tracking-tight text-[#1c1218]">
                            <span className="font-serif italic font-normal text-[#c4325c] tracking-normal mr-2">
                                Healthcare,
                            </span>
                            <br />
                            <span className="font-heading font-black">
                                but more human.
                            </span>
                        </h1>
                    </div>

                    {/* Short Supporting Sentence */}
                    <p className="text-sm md:text-base lg:text-lg font-medium text-[#7d6974] leading-relaxed max-w-md">
                        AI-assisted clinical triage connecting patients, doctors, and frontline care workers through intelligent human-centered care.
                    </p>

                    {/* Clean Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <MagneticButton
                            onClick={handleEnter}
                            className="group px-8 py-4 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-sm md:text-base font-black shadow-md hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer"
                        >
                            <span>Enter Sanjeevani</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                        </MagneticButton>

                        <button
                            onClick={scrollToUnderstand}
                            className="px-6 py-4 rounded-full bg-white/70 hover:bg-white border border-[#f5e4ec] hover:border-[#f8c8d8] text-xs md:text-sm font-bold text-[#4a3c45] hover:text-[#e13b68] transition flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            <span>Explore</span>
                            <ChevronDown className="w-3.5 h-3.5 text-[#7d6974]" />
                        </button>
                    </div>
                </div>

                {/* Right Column: Live 3D DNA Helix (6 cols) */}
                <div className="lg:col-span-6 xl:col-span-6 w-full h-full flex items-center justify-center relative min-h-[580px] md:min-h-[700px] lg:min-h-[820px]">
                    {/* Soft Atmospheric Glow */}
                    <div className="absolute w-80 h-80 md:w-96 md:h-96 bg-[#f8c8d8]/25 rounded-full blur-3xl pointer-events-none -z-10" />

                    {/* Three.js Live WebGL Extended DNA Helix Canvas */}
                    <DnaHelix3D />
                </div>
            </main>

            {/* 02 — UNDERSTAND (Intelligent Intake) */}
            <div ref={understandSectionRef}>
                <UnderstandSection onEnterPlatform={handleEnter} />
            </div>

            {/* 03 — DIGITAL HEALTH VAULT */}
            <HealthRecordsSection />

            {/* 04 — CONTINUITY & 3D BIOMOLECULAR ORB */}
            <ReturnDnaSection onEnterPlatform={handleEnter} />
        </div>
    );
};

export default LandingHero;
