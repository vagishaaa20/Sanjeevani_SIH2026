import React from 'react';

/**
 * MinimalistAvatar - Inspired by 21st.dev / Linear / HeroUI
 * Renders an ultra-clean, modern minimalist vector avatar with soft ambient lighting,
 * smooth pastel clinical palettes, and role-based or deterministic user styling.
 */
export const MinimalistAvatar = ({
    name = 'User',
    role = 'patient',
    size = 48,
    className = '',
    showStatus = false,
    status = 'online', // 'online' | 'busy' | 'away'
}) => {
    // Generate consistent visual variation based on name
    const charCode = (name || 'U').charCodeAt(0) + ((name || 'U').charCodeAt(1) || 0);
    const paletteIndex = charCode % 4;

    const palettes = [
        { bg: 'from-[#ffe4ec] to-[#ffd0df]', stroke: '#e13b68', fill: '#f06292', accent: '#c2185b' },
        { bg: 'from-[#fce7f3] to-[#fbcfe8]', stroke: '#db2777', fill: '#f472b6', accent: '#9d174d' },
        { bg: 'from-[#ffebee] to-[#ffcdd2]', stroke: '#e53935', fill: '#ef5350', accent: '#b71c1c' },
        { bg: 'from-[#fff1f2] to-[#ffe4e6]', stroke: '#f43f5e', fill: '#fb7185', accent: '#be123c' },
    ];
    const pal = palettes[paletteIndex];

    const initial = (name || 'U').trim().charAt(0).toUpperCase();

    // Render clean SVG minimalist illustration
    const renderAvatarIllustration = () => {
        if (role === 'doctor') {
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Soft ambient background */}
                    <circle cx="50" cy="50" r="48" fill="#FFF0F5" />
                    <circle cx="50" cy="50" r="48" stroke="#F8C8D8" strokeWidth="2" />
                    
                    {/* Shoulders & White Coat */}
                    <path d="M 22 92 C 22 72, 36 62, 50 62 C 64 62, 78 72, 78 92 Z" fill="#FFFFFF" stroke="#E13B68" strokeWidth="2.5" />
                    {/* Scrub V-Neck */}
                    <path d="M 40 62 L 50 76 L 60 62 Z" fill="#FFE6EE" stroke="#E13B68" strokeWidth="2" />
                    
                    {/* Head */}
                    <circle cx="50" cy="38" r="18" fill="#FFE0E9" stroke="#E13B68" strokeWidth="2.5" />
                    {/* Minimalist Hair / Cap */}
                    <path d="M 32 36 C 32 24, 40 18, 50 18 C 60 18, 68 24, 68 36 C 63 32, 56 30, 50 30 C 44 30, 37 32, 32 36 Z" fill="#E13B68" />
                    
                    {/* Stethoscope around neck */}
                    <path d="M 38 62 C 38 74, 46 80, 50 80 C 54 80, 62 74, 62 62" stroke="#2D2329" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <circle cx="50" cy="83" r="4.5" fill="#E13B68" stroke="#2D2329" strokeWidth="1.5" />
                </svg>
            );
        }

        if (role === 'health_worker') {
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" fill="#FFF0F5" />
                    <circle cx="50" cy="50" r="48" stroke="#F8C8D8" strokeWidth="2" />
                    {/* Shoulders */}
                    <path d="M 22 92 C 22 72, 36 64, 50 64 C 64 64, 78 72, 78 92 Z" fill="#FFE6EE" stroke="#E13B68" strokeWidth="2.5" />
                    {/* Head */}
                    <circle cx="50" cy="40" r="18" fill="#FFF" stroke="#E13B68" strokeWidth="2.5" />
                    {/* Red Cross Medical Badge on Chest */}
                    <g transform="translate(50, 78)">
                        <circle cx="0" cy="0" r="7" fill="#E13B68" />
                        <rect x="-1.5" y="-4" width="3" height="8" fill="#FFF" rx="0.5" />
                        <rect x="-4" y="-1.5" width="8" height="3" fill="#FFF" rx="0.5" />
                    </g>
                    {/* Minimalist Hair */}
                    <path d="M 32 38 C 32 26, 40 20, 50 20 C 60 20, 68 26, 68 38 C 64 34, 56 32, 50 32 C 44 32, 36 34, 32 38 Z" fill="#2D2329" />
                </svg>
            );
        }

        if (role === 'clinic') {
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" fill="#FFF0F5" />
                    <circle cx="50" cy="50" r="48" stroke="#F8C8D8" strokeWidth="2" />
                    {/* Modern Clinic Building */}
                    <rect x="30" y="34" width="40" height="52" rx="6" fill="#FFF" stroke="#E13B68" strokeWidth="2.5" />
                    <rect x="42" y="66" width="16" height="20" rx="3" fill="#FFE6EE" stroke="#E13B68" strokeWidth="2" />
                    {/* Medical Cross Sign */}
                    <g transform="translate(50, 48)">
                        <circle cx="0" cy="0" r="8" fill="#FFE6EE" stroke="#E13B68" strokeWidth="1.5" />
                        <rect x="-1.5" y="-5" width="3" height="10" fill="#E13B68" rx="0.5" />
                        <rect x="-5" y="-1.5" width="10" height="3" fill="#E13B68" rx="0.5" />
                    </g>
                </svg>
            );
        }

        // Default: Minimalist Patient Avatar (Clean geometric face + subtle typography)
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id={`avatarGrad-${paletteIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF5F8" />
                        <stop offset="100%" stopColor="#FFE4EC" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill={`url(#avatarGrad-${paletteIndex})`} />
                <circle cx="50" cy="50" r="48" stroke="#F8C8D8" strokeWidth="2" />
                
                {/* Minimalist Body / Torso */}
                <path d="M 20 94 C 20 74, 34 64, 50 64 C 66 64, 80 74, 80 94 Z" fill="#FFFFFF" stroke="#E13B68" strokeWidth="2.5" />
                
                {/* Minimalist Face & Head */}
                <circle cx="50" cy="40" r="18" fill="#FFE6EE" stroke="#E13B68" strokeWidth="2.5" />
                
                {/* Clean Modern Hair Stroke */}
                <path d="M 32 38 C 32 26, 40 20, 50 20 C 60 20, 68 26, 68 38 C 63 34, 56 32, 50 32 C 44 32, 37 34, 32 38 Z" fill="#E13B68" />
                
                {/* Subtle Monogram Initial Badge */}
                <g transform="translate(50, 80)">
                    <circle cx="0" cy="0" r="9" fill="#E13B68" />
                    <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="900"
                        fontFamily="system-ui, -apple-system, sans-serif"
                    >
                        {initial}
                    </text>
                </g>
            </svg>
        );
    };

    return (
        <div
            className={`relative flex-shrink-0 inline-flex items-center justify-center rounded-2xl md:rounded-3xl p-0.5 bg-gradient-to-tr ${pal.bg} shadow-xs hover:shadow-md transition-all group ${className}`}
            style={{ width: size, height: size }}
        >
            <div className="w-full h-full rounded-[14px] md:rounded-[22px] overflow-hidden flex items-center justify-center bg-white/40 backdrop-blur-2xs">
                {renderAvatarIllustration()}
            </div>

            {/* Status indicator dot */}
            {showStatus && (
                <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                        status === 'online'
                            ? 'bg-emerald-500'
                            : status === 'busy'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                    }`}
                />
            )}
        </div>
    );
};

export default MinimalistAvatar;
