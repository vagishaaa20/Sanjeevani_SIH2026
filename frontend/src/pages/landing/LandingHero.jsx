import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Globe, Sun, Moon } from 'lucide-react';
import DnaHelix3D from '../../components/landing/DnaHelix3D';
import ShaderAtmosphere from '../../components/landing/ShaderAtmosphere';
import MagneticButton from '../../components/landing/MagneticButton';
import StatsBarSection from '../../components/landing/StatsBarSection';
import UnderstandSection from '../../components/landing/UnderstandSection';
import RoleHighlightsSection from '../../components/landing/RoleHighlightsSection';
import HealthRecordsSection from '../../components/landing/HealthRecordsSection';
import SecurityTrustSection from '../../components/landing/SecurityTrustSection';
import TestimonialsSection from '../../components/landing/TestimonialsSection';
import FaqSection from '../../components/landing/FaqSection';
import ReturnDnaSection from '../../components/landing/ReturnDnaSection';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';

export const LandingHero = () => {
    const { user, logout } = useAuth();
    const { currentLang, setCurrentLang, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
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

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const scrollToUnderstand = () => {
        understandSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* Ambient WebGL Shader Mist & Depth */}
            <ShaderAtmosphere />

            {/* Sticky Editorial Top Navigation */}
            <header className="sticky top-0 z-40 w-full backdrop-blur-md" style={{ background: 'var(--navbar-bg)', borderBottom: '1px solid var(--border)' }}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-2 md:py-3 flex items-center justify-between">
                    {/* Brand Mark */}
                    <Link
                        to="/"
                        className="flex items-center gap-3.5 text-lg font-black tracking-tight group"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <div className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform p-1" style={{ background: 'var(--logo-gradient)', borderColor: 'var(--border)' }}>
                            <SanjeevaniLogo variant="emblem" size={42} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-heading tracking-tight font-black text-2xl leading-none">{t("SANJEEVANI")}</span>
                            <span className="text-[10px] font-extrabold tracking-widest uppercase mt-1" style={{ color: 'var(--accent)' }}>{t("Intelligent Clinical Platform")}</span>
                        </div>
                    </Link>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 md:gap-5">
                        {/* Language Switcher */}
                        <div className="flex items-center gap-1.5 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-bold transition" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                            <Globe className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                            <select
                                value={currentLang}
                                onChange={(e) => setCurrentLang(e.target.value)}
                                className="bg-transparent focus:outline-none cursor-pointer font-bold pr-1"
                                style={{ color: 'var(--text-primary)' }}
                                aria-label="Select Language"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिन्दी</option>
                                <option value="bn">বাংলা</option>
                            </select>
                        </div>

                        {/* Dark Mode Toggle */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            className="p-1.5 md:p-2 rounded-full transition cursor-pointer"
                            style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            {isDark ? (
                                <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
                            ) : (
                                <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                            )}
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleLogout}
                                    className="text-xs font-bold transition cursor-pointer"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {t("Sign Out")}
                                </button>
                                <button
                                    onClick={handleEnter}
                                    className="px-5 py-2 rounded-full text-white text-xs font-black transition shadow-xs cursor-pointer"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    {t("Dashboard →")}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="text-xs font-bold transition"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {t("Sign In")}
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 rounded-full text-white text-xs font-black transition shadow-xs"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    {t("Register")}
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
                    <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: 'var(--accent)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                        {t("01 — Sanjeevani Healthcare")}
                    </div>

                    {/* Editorial Headline */}
                    <div className="flex flex-col">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-black leading-[1.04] tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            <span className="font-serif italic font-normal tracking-normal mr-2" style={{ color: 'var(--accent)' }}>
                                {t("Healthcare,")}
                            </span>
                            <br />
                            <span className="font-heading font-black">
                                {t("but more human.")}
                            </span>
                        </h1>
                    </div>

                    {/* Short Supporting Sentence */}
                    <p className="text-sm md:text-base lg:text-lg font-medium leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
                        {t("AI-assisted clinical triage connecting patients, doctors, and frontline care workers through intelligent human-centered care.")}
                    </p>

                    {/* Clean Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <MagneticButton
                            onClick={handleEnter}
                            className="group px-8 py-4 rounded-full text-white text-sm md:text-base font-black shadow-md hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer"
                            style={{ background: 'var(--accent)' }}
                        >
                            <span>{t("Enter Sanjeevani")}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                        </MagneticButton>

                        <button
                            onClick={scrollToUnderstand}
                            className="px-6 py-4 rounded-full text-xs md:text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                            <span>{t("Explore Features")}</span>
                            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                    </div>
                </div>

                {/* Right Column: Live 3D DNA Helix (6 cols) */}
                <div className="lg:col-span-6 xl:col-span-6 w-full h-full flex items-center justify-center relative min-h-[580px] md:min-h-[700px] lg:min-h-[820px]">
                    {/* Soft Atmospheric Glow */}
                    <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'var(--accent-light)', opacity: 0.4 }} />

                    {/* Three.js Live WebGL Extended DNA Helix Canvas */}
                    <DnaHelix3D />
                </div>
            </main>

            {/* STATS BAR SECTION */}
            <StatsBarSection />

            {/* 02 — UNDERSTAND (Intelligent Intake) */}
            <div ref={understandSectionRef}>
                <UnderstandSection onEnterPlatform={handleEnter} />
            </div>

            {/* 03 — MULTI-ROLE ECOSYSTEM */}
            <RoleHighlightsSection onEnterPlatform={handleEnter} />

            {/* 04 — DIGITAL HEALTH VAULT */}
            <HealthRecordsSection />

            {/* 05 — TRUST & COMPLIANCE (ABDM & Security Grid) */}
            <SecurityTrustSection />

            {/* 06 — VERIFIED CLINICAL TESTIMONIALS */}
            <TestimonialsSection />

            {/* 07 — FREQUENTLY ASKED QUESTIONS */}
            <FaqSection />

            {/* 08 — CONTINUITY & 3D BIOMOLECULAR ORB */}
            <ReturnDnaSection onEnterPlatform={handleEnter} />
        </div>
    );
};

export default LandingHero;
