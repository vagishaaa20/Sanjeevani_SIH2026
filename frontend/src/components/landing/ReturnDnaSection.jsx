import React from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import BiomolecularOrb3D from './BiomolecularOrb3D';
import MagneticButton from './MagneticButton';
import useAuth from '../../hooks/useAuth';
import SanjeevaniLogo from '../common/SanjeevaniLogo';

export const ReturnDnaSection = ({ onEnterPlatform }) => {
    const { user } = useAuth();

    return (
        <section className="relative w-full py-20 md:py-28 px-6 md:px-12 max-w-6xl mx-auto z-20 flex flex-col items-center text-center">
            {/* 3D Living Biomolecular Chromatic Orb */}
            <div className="w-full max-w-md mx-auto mb-4 flex items-center justify-center">
                <BiomolecularOrb3D />
            </div>

            {/* Concise Calm Statement */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] max-w-2xl mb-4" style={{ color: 'var(--text-primary)' }}>
                Your health deserves a{' '}
                <span className="font-serif italic font-normal" style={{ color: 'var(--accent-hover)' }}>
                    calmer experience.
                </span>
            </h2>

            <p className="text-sm sm:text-base font-medium leading-relaxed max-w-md mb-8" style={{ color: 'var(--text-secondary)' }}>
                Structured AI clinical triage, secure health records, and seamless care networks in one unified platform.
            </p>

            {/* Clear Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
                <MagneticButton
                    onClick={onEnterPlatform}
                    className="px-8 py-3.5 rounded-full text-white text-sm font-black shadow-md hover:shadow-xl transition-all flex items-center gap-2.5 cursor-pointer"
                    style={{ background: 'var(--accent)' }}
                >
                    <span>{user ? 'Enter Dashboard' : 'Get Started with Sanjeevani'}</span>
                    <ArrowRight className="w-4 h-4" />
                </MagneticButton>

                {!user && (
                    <Link
                        to="/login"
                        className="px-6 py-3.5 rounded-full border text-xs font-bold transition shadow-xs hover:opacity-80"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                        Sign In to Account
                    </Link>
                )}
            </div>

            {/* Minimal Brand Footer */}
            <div className="mt-20 pt-8 border-t border-[#f5e4ec] w-full flex flex-col sm:flex-row items-center justify-between text-xs text-[#7d6974] gap-4 font-semibold">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cream-card border border-[#f5c6d6] flex items-center justify-center p-0.5 shadow-2xs">
                        <SanjeevaniLogo variant="emblem" size={24} />
                    </div>
                    <span className="font-heading font-black text-sm text-[#1c1218]">SANJEEVANI</span>
                </div>

                <p>© 2026 Sanjeevani Health Network.</p>

                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--pastel-mint-text)' }} />
                    <span>Clinical Network Active</span>
                </div>
            </div>
        </section>
    );
};

export default ReturnDnaSection;
