import React from 'react';

/**
 * Minimalist Healthcare Mascot Visual for Sign In / Registration.
 * A static, heartwarming vector-editorial illustration of compassionate clinical care.
 */
export const CareMascotVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center relative select-none py-4">
            {/* Ambient Soft Blush Glow */}
            <div className="absolute w-[500px] h-[520px] bg-[#ffe4ec]/45 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Main Mascot Card Container */}
            <div className="relative max-w-[500px] w-full rounded-3xl overflow-hidden border border-[#f5e4ec] bg-white/70 shadow-lg backdrop-blur-md">
                <img
                    src="/care_mascot.jpg"
                    alt="Sanjeevani Compassionate Care"
                    className="w-full h-auto object-cover block"
                    loading="eager"
                />
            </div>
        </div>
    );
};

export default CareMascotVisual;
