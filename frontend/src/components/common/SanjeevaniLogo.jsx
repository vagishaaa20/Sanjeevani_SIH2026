import React from 'react';

/**
 * SanjeevaniLogo
 * Official Medical-Tech Stethoscope Infinity Emblem & Platform Brand Mark
 * 
 * Variants:
 * - 'emblem': The standalone infinity-stethoscope & pulse icon (magnified & crisp for navbar, sidebar, buttons, avatar)
 * - 'full': Complete vertical badge with tech dial rings, emblem, and typography
 * - 'inline': Horizontal emblem + crisp modern brand text
 */
export const SanjeevaniLogo = ({
    variant = 'emblem',
    className = '',
    size = 40,
    showText = true,
    showSubtitle = true,
}) => {
    // Standalone Magnified Emblem Icon (Tight viewBox for maximum impact & zero dead margins)
    if (variant === 'emblem') {
        return (
            <svg
                viewBox="285 100 330 365"
                width={size}
                height={size}
                className={`overflow-visible flex-shrink-0 ${className}`}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="emblemPinkHalo" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FF2A85" stopOpacity="0.28" />
                        <stop offset="60%" stopColor="#FF5C9D" stopOpacity="0.10" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </radialGradient>

                    <linearGradient id="emblemInfinityPink" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF2A7A" />
                        <stop offset="35%" stopColor="#E91E63" />
                        <stop offset="70%" stopColor="#D81B60" />
                        <stop offset="100%" stopColor="#AD1457" />
                    </linearGradient>

                    <linearGradient id="emblemChrome" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F8BBD0" />
                        <stop offset="40%" stopColor="#FFFFFF" />
                        <stop offset="70%" stopColor="#F48FB1" />
                        <stop offset="100%" stopColor="#AD1457" />
                    </linearGradient>

                    <filter id="emblemGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#D81B60" floodOpacity="0.25" />
                    </filter>
                </defs>

                {/* Ambient Soft Glow */}
                <circle cx="450" cy="275" r="160" fill="url(#emblemPinkHalo)" />

                {/* Subtle Tech Dial Rings */}
                <g opacity="0.4" stroke="#F48FB1" fill="none">
                    <circle cx="450" cy="275" r="145" strokeWidth="1.8" strokeDasharray="6 8" />
                    <circle cx="450" cy="275" r="165" strokeWidth="2" strokeDasharray="60 15 10 15" />
                </g>

                {/* Main Stethoscope Infinity Ribbon with Glow */}
                <g filter="url(#emblemGlow)">
                    {/* Binaural Earpieces */}
                    <circle cx="395" cy="112" r="8.5" fill="#FFFFFF" stroke="#C2185B" strokeWidth="4" />
                    <circle cx="505" cy="112" r="8.5" fill="#FFFFFF" stroke="#C2185B" strokeWidth="4" />

                    {/* Headset Metallic Arms */}
                    <path
                        d="M 395 118 C 395 156, 424 174, 450 180 C 476 174, 505 156, 505 118"
                        fill="none"
                        stroke="url(#emblemChrome)"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />

                    {/* Connector Joint */}
                    <rect x="445.5" y="177" width="9" height="13" rx="2.5" fill="#FFFFFF" stroke="#C2185B" strokeWidth="2.5" />

                    {/* Lead Tube connecting stem to Ribbon Loop */}
                    <path d="M 450 190 L 450 202" fill="none" stroke="url(#emblemInfinityPink)" strokeWidth="10" strokeLinecap="round" />

                    {/* Ribbon Strand A: Sweeps Left across the Kinetic Infinity Loop */}
                    <path
                        d="M 450 190 C 410 190, 305 210, 305 290 C 305 362, 410 392, 450 285 C 485 192, 595 222, 595 290 C 595 352, 525 382, 475 382"
                        fill="none"
                        stroke="url(#emblemInfinityPink)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Ribbon Strand B: Lower loop continuation */}
                    <path
                        d="M 475 382 C 440 382, 420 372, 400 352 C 385 336, 380 315, 395 298 C 410 282, 435 282, 450 285"
                        fill="none"
                        stroke="url(#emblemInfinityPink)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="140 10"
                    />

                    {/* Pulse / Lifeline ECG Accent Line */}
                    <path
                        d="M 285 290 L 345 290 L 360 265 L 375 315 L 395 240 L 415 340 L 430 275 L 445 303 L 458 290 L 615 290"
                        fill="none"
                        stroke="#38006b"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Tube Extension to Sensor Chestpiece */}
                    <path
                        d="M 595 290 C 615 325, 608 376, 568 412 C 536 438, 480 438, 440 432 L 380 432"
                        fill="none"
                        stroke="url(#emblemInfinityPink)"
                        strokeWidth="9"
                        strokeLinecap="round"
                    />

                    {/* Acoustic Sensor Disc (Chestpiece) */}
                    <g transform="translate(365, 432)">
                        <circle cx="0" cy="0" r="27" fill="none" stroke="#E91E63" strokeWidth="3" strokeDasharray="10 4" />
                        <circle cx="0" cy="0" r="21" fill="#FFFFFF" stroke="url(#emblemChrome)" strokeWidth="4.5" />
                        <circle cx="0" cy="0" r="11" fill="#F06292" />
                        <circle cx="0" cy="0" r="5.5" fill="#AD1457" />
                    </g>

                    {/* Star / Lens Highlights */}
                    <g fill="#FFFFFF">
                        <circle cx="450" cy="190" r="4" />
                        <circle cx="305" cy="290" r="4" />
                        <circle cx="595" cy="290" r="4" />
                        <circle cx="395" cy="240" r="3.5" fill="#F8BBD0" />
                        <path d="M 450 275 Q 450 285 460 285 Q 450 285 450 295 Q 450 285 440 285 Q 450 285 450 275 Z" fill="#FFFFFF" opacity="0.95" />
                    </g>
                </g>
            </svg>
        );
    }

    // Inline Brand: Emblem + Horizontal Typography
    if (variant === 'inline') {
        return (
            <div className={`inline-flex items-center gap-3 ${className}`}>
                <div
                    className="flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ffe6ee] to-white border border-[#f5c6d6] shadow-xs flex-shrink-0"
                    style={{ width: size, height: size, padding: size * 0.05 }}
                >
                    <SanjeevaniLogo variant="emblem" size={size * 0.9} />
                </div>
                {showText && (
                    <div className="flex flex-col text-left">
                        <span className="font-heading font-black text-lg md:text-xl tracking-tight text-[#2d2329] leading-tight">
                            SANJEEVANI
                        </span>
                        {showSubtitle && (
                            <span className="text-[10px] md:text-[11px] font-bold text-[#e13b68] tracking-widest uppercase -mt-0.5">
                                Intelligent Clinical Platform
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Full Vertical Presentation Badge
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 900 700"
            width={size || '100%'}
            height="auto"
            className={`w-full max-w-full ${className}`}
        >
            <defs>
                <radialGradient id="fullLightBg" cx="50%" cy="42%" r="75%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor="#FFF8FA" />
                    <stop offset="100%" stopColor="#FFF0F5" />
                </radialGradient>

                <radialGradient id="fullPinkHalo" cx="50%" cy="40%" r="48%">
                    <stop offset="0%" stopColor="#FF2A85" stopOpacity="0.14" />
                    <stop offset="55%" stopColor="#FF5C9D" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </radialGradient>

                <filter id="fullGlowShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#D81B60" floodOpacity="0.18" />
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#FF2A85" floodOpacity="0.22" />
                </filter>

                <linearGradient id="fullInfinityPink" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF4081" />
                    <stop offset="30%" stopColor="#F50057" />
                    <stop offset="70%" stopColor="#D81B60" />
                    <stop offset="100%" stopColor="#C2185B" />
                </linearGradient>

                <linearGradient id="fullChrome" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F8BBD0" />
                    <stop offset="40%" stopColor="#FFFFFF" />
                    <stop offset="70%" stopColor="#F48FB1" />
                    <stop offset="100%" stopColor="#AD1457" />
                </linearGradient>

                <linearGradient id="fullBrandTextLight" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C2185B" />
                    <stop offset="50%" stopColor="#E91E63" />
                    <stop offset="100%" stopColor="#AD1457" />
                </linearGradient>
            </defs>

            <rect width="100%" height="100%" rx="32" fill="url(#fullLightBg)" />

            <circle cx="450" cy="285" r="270" fill="url(#fullPinkHalo)" />

            <g opacity="0.32" stroke="#F48FB1" fill="none">
                <circle cx="450" cy="285" r="185" strokeWidth="1.2" strokeDasharray="6 8" />
                <circle cx="450" cy="285" r="225" strokeWidth="1.6" strokeDasharray="90 20 12 20" />
                <circle cx="450" cy="285" r="240" strokeWidth="0.75" />
                <circle cx="450" cy="285" r="255" strokeWidth="1.4" strokeDasharray="12 12" />
            </g>

            <g filter="url(#fullGlowShadow)">
                <circle cx="395" cy="110" r="7.5" fill="#FFFFFF" stroke="#C2185B" strokeWidth="3.5" />
                <circle cx="505" cy="110" r="7.5" fill="#FFFFFF" stroke="#C2185B" strokeWidth="3.5" />

                <path
                    d="M 395 117.5 C 395 155, 424 173, 450 179 C 476 173, 505 155, 505 117.5"
                    fill="none"
                    stroke="url(#fullChrome)"
                    strokeWidth="5"
                    strokeLinecap="round"
                />

                <rect x="446" y="176" width="8" height="12" rx="2" fill="#FFFFFF" stroke="#C2185B" strokeWidth="2" />

                <path d="M 450 188 L 450 200" fill="none" stroke="url(#fullInfinityPink)" strokeWidth="8" strokeLinecap="round" />

                <path
                    d="M 450 188 C 410 188, 310 210, 310 290 C 310 360, 410 390, 450 285 C 485 195, 590 225, 590 290 C 590 350, 525 380, 475 380"
                    fill="none"
                    stroke="url(#fullInfinityPink)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                <path
                    d="M 475 380 C 440 380, 420 370, 400 350 C 385 335, 380 315, 395 300 C 410 285, 435 285, 450 285"
                    fill="none"
                    stroke="url(#fullInfinityPink)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="140 10"
                />

                <path
                    d="M 285 290 L 345 290 L 360 265 L 375 315 L 395 240 L 415 340 L 430 275 L 445 303 L 458 290 L 615 290"
                    fill="none"
                    stroke="#4A148C"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                <path
                    d="M 590 290 C 610 325, 605 375, 565 410 C 535 435, 480 435, 440 430 L 380 430"
                    fill="none"
                    stroke="url(#fullInfinityPink)"
                    strokeWidth="7"
                    strokeLinecap="round"
                />

                <g transform="translate(365, 430)">
                    <circle cx="0" cy="0" r="25" fill="none" stroke="#E91E63" strokeWidth="2.5" strokeDasharray="10 4" />
                    <circle cx="0" cy="0" r="19" fill="#FFFFFF" stroke="url(#fullChrome)" strokeWidth="3.5" />
                    <circle cx="0" cy="0" r="10" fill="#F06292" />
                    <circle cx="0" cy="0" r="5" fill="#AD1457" />
                </g>

                <g fill="#FFFFFF">
                    <circle cx="450" cy="188" r="3" />
                    <circle cx="310" cy="290" r="3" />
                    <circle cx="590" cy="290" r="3" />
                    <circle cx="395" cy="240" r="2.5" fill="#F8BBD0" />
                    <path d="M 450 275 Q 450 285 460 285 Q 450 285 450 295 Q 450 285 440 285 Q 450 285 450 275 Z" fill="#FFFFFF" opacity="0.95" />
                </g>
            </g>

            <g textAnchor="middle">
                <text
                    x="450"
                    y="555"
                    fontFamily="'Montserrat', 'Rajdhani', 'Segoe UI', system-ui, sans-serif"
                    fontSize="50"
                    fontWeight="900"
                    letterSpacing="14"
                    fill="url(#fullBrandTextLight)"
                >
                    SANJEEVANI
                </text>

                <text
                    x="450"
                    y="594"
                    fontFamily="'Montserrat', 'Rajdhani', 'Segoe UI', system-ui, sans-serif"
                    fontSize="13"
                    fontWeight="700"
                    letterSpacing="8"
                    fill="#880E4F"
                    opacity="0.85"
                >
                    INTELLIGENT CLINICAL PLATFORM
                </text>

                <g transform="translate(450, 620)" stroke="#D81B60" strokeWidth="1.8" opacity="0.75">
                    <line x1="-28" y1="0" x2="28" y2="0" />
                    <line x1="0" y1="-5" x2="0" y2="5" />
                    <circle cx="0" cy="0" r="2.5" fill="#AD1457" />
                </g>
            </g>
        </svg>
    );
};

export default SanjeevaniLogo;
