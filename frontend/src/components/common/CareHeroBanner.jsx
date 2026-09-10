import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export const CareHeroBanner = ({
    headline = "Care. Connect. Heal.",
    tagline = "You are making a difference in someone's life today.",
    className = "",
}) => {
    return (
        <div
            className={`w-full rounded-3xl p-6 md:p-8 bg-gradient-to-r from-[#ffeff3] via-[#ffe3ec] to-[#fce4ee] border border-[#f8d4e2] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs ${className}`}
        >
            {/* Background Decorative Shapes */}
            <div className="absolute top-3 right-1/3 w-32 h-32 rounded-full bg-rose-200/30 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 left-12 w-40 h-40 rounded-full bg-pink-300/20 blur-xl pointer-events-none" />

            <div className="flex flex-col gap-2 z-10 max-w-xl text-left">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-[11px] font-black uppercase tracking-wider bg-white/80 border border-[#f4c6d7] text-[#e13b68] rounded-full flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>Sanjeevani Care Network</span>
                    </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-[#2d2329] tracking-tight font-heading leading-tight mt-1">
                    {headline}
                </h2>

                <p className="text-sm font-semibold text-[#66505c] flex items-center gap-1.5 leading-relaxed">
                    <span>{tagline}</span>
                    <Heart className="w-4 h-4 fill-[#e13b68] text-[#e13b68] inline-block flex-shrink-0 animate-pulse" />
                </p>
            </div>

            {/* Custom Healthcare Vector Illustration */}
            <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
                <div className="relative w-44 h-36 md:w-56 md:h-40 flex items-center justify-center">
                    {/* SVG Illustration: Caring Health Professional & Patient */}
                    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                        {/* Background Heart Pulse Circle */}
                        <circle cx="120" cy="80" r="65" fill="#ffffff" fillOpacity="0.7" />
                        <circle cx="120" cy="80" r="55" fill="#ffe3ed" fillOpacity="0.5" />
                        
                        {/* Heart Icon Floating */}
                        <path d="M120 50 C110 35 85 45 95 65 C105 85 120 100 120 100 C120 100 135 85 145 65 C155 45 130 35 120 50 Z" fill="#e13b68" fillOpacity="0.85" />
                        <path d="M100 70 L112 70 L116 62 L124 78 L128 70 L140 70" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Left Doctor Figure */}
                        <circle cx="75" cy="55" r="16" fill="#f8b4c8" />
                        <path d="M63 50 C63 40 87 40 87 50 C87 55 63 55 63 50 Z" fill="#4d323e" />
                        <path d="M50 110 C50 82 100 82 100 110 Z" fill="#e13b68" />
                        <path d="M75 82 L75 110" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />

                        {/* Right Patient/Elder Figure */}
                        <circle cx="165" cy="60" r="15" fill="#ffd5c6" />
                        <path d="M152 56 C152 48 178 48 178 56 Z" fill="#a08b95" />
                        <path d="M142 110 C142 88 188 88 188 110 Z" fill="#7c606d" />

                        {/* Sparkle details */}
                        <circle cx="45" cy="40" r="3" fill="#e13b68" />
                        <circle cx="195" cy="45" r="4" fill="#f4a6c1" />
                        <circle cx="205" cy="95" r="2.5" fill="#e13b68" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default CareHeroBanner;
