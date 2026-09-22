import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Heart, Globe, Sun, Moon } from 'lucide-react';
import DnaHelix3D from '../../components/landing/DnaHelix3D';
import ShaderAtmosphere from '../../components/landing/ShaderAtmosphere';
import MagneticButton from '../../components/landing/MagneticButton';
import UnderstandSection from '../../components/landing/UnderstandSection';
import HealthRecordsSection from '../../components/landing/HealthRecordsSection';
import ReturnDnaSection from '../../components/landing/ReturnDnaSection';
import EcosystemSection from '../../components/landing/EcosystemSection';
import WorkflowSection from '../../components/landing/WorkflowSection';
import ProblemStatement from '../../components/landing/ProblemStatement';
import ConnectedJourney from '../../components/landing/ConnectedJourney';
import NetworkVisualization from '../../components/landing/NetworkVisualization';
import HighRiskSection from '../../components/landing/HighRiskSection';
import OfflineCareSection from '../../components/landing/OfflineCareSection';
import MultilingualSection from '../../components/landing/MultilingualSection';
import CoordinationSection from '../../components/landing/CoordinationSection';
import TechnologyStack from '../../components/landing/TechnologyStack';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';

export const LandingHero = () => {
    const { user, logout } = useAuth();
    const { currentLang, setCurrentLang } = useLanguage();
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
                            <span className="font-heading tracking-tight font-black text-2xl leading-none">SANJEEVANI</span>
                            <span className="text-[10px] font-extrabold tracking-widest uppercase mt-1" style={{ color: 'var(--accent)' }}>Intelligent Clinical Platform</span>
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
                                    Sign Out
                                </button>
                                <button
                                    onClick={handleEnter}
                                    className="px-5 py-2 rounded-full text-white text-xs font-black transition shadow-xs cursor-pointer"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    Dashboard →
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="text-xs font-bold transition"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 rounded-full text-white text-xs font-black transition shadow-xs"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* 01 — HERO COMPOSITION */}
            <main className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-0 pb-0">
                {/* Left Column: Refined Editorial Typography & CTAs (6 cols) */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left gap-6 md:gap-7 pt-16 md:pt-24 lg:pt-32 relative z-20">
                    {/* Editorial Headline */}
                    <div className="flex flex-col">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-black leading-[1.04] tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            <span className="font-serif italic font-normal tracking-normal mr-2" style={{ color: 'var(--accent)' }}>
                                Healthcare,
                            </span>
                            <br />
                            <span className="font-heading font-black">
                                but more human.
                            </span>
                        </h1>
                    </div>

                    {/* Short Supporting Sentence */}
                    <p className="text-sm md:text-base lg:text-lg font-medium leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
                        AI-assisted clinical triage connecting patients, doctors, and frontline care workers through intelligent human-centered care.
                    </p>

                    {/* Clean Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <MagneticButton
                            onClick={handleEnter}
                            className="group px-8 py-4 rounded-full text-white text-sm md:text-base font-black shadow-md hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer"
                            style={{ background: 'var(--accent)' }}
                        >
                            <span>Enter Sanjeevani</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                        </MagneticButton>

                        <button
                            onClick={scrollToUnderstand}
                            className="px-6 py-4 rounded-full text-xs md:text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                            <span>Explore</span>
                            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                    </div>
                </div>

                {/* Right Column: Live 3D DNA Helix (6 cols) */}
                <div 
                    className="lg:col-span-6 xl:col-span-6 w-full h-full flex items-center justify-center relative min-h-[580px] md:min-h-[700px] lg:min-h-[820px] lg:-ml-8 -mt-8 md:mt-0 lg:-mb-32 xl:-mb-48 z-0"
                    style={{ 
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 50%, transparent 75%)',
                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 50%, transparent 75%)' 
                    }}
                >
                    {/* Soft Atmospheric Glow */}
                    <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'var(--accent-light)', opacity: 0.4 }} />

                    {/* Three.js Live WebGL Extended DNA Helix Canvas */}
                    <DnaHelix3D />
                </div>
            </main>

            {/* 03 — THE PROBLEM */}
            <ProblemStatement />

            {/* 04 — ONE CONNECTED JOURNEY */}
            <ConnectedJourney />

            {/* 05 — SANJEEVANI NETWORK */}
            <NetworkVisualization />

            {/* 06 — HOW IT WORKS */}
            <WorkflowSection />

            {/* 07 — INTELLIGENT TRIAGE */}
            <div ref={understandSectionRef}>
                <UnderstandSection onEnterPlatform={handleEnter} />
            </div>

            {/* 08 — HIGH-RISK PATIENT MANAGEMENT */}
            <HighRiskSection />

            {/* 09 — DIGITAL HEALTH VAULT */}
            <HealthRecordsSection />

            {/* 10 — LOW-CONNECTIVITY CARE */}
            <OfflineCareSection />

            {/* 11 — MULTILINGUAL HEALTHCARE */}
            <MultilingualSection />

            {/* 12 — DIAGNOSTICS + MEDICINES */}
            <CoordinationSection />

            {/* 13 — TECHNOLOGY + AI */}
            <TechnologyStack />

            {/* 14 — ECOSYSTEM REVEAL */}
            <EcosystemSection />

            {/* 15 — CONTINUITY & FINAL CTA */}
            <ReturnDnaSection onEnterPlatform={handleEnter} />
        </div>
    );
};

export default LandingHero;
