import React, { useRef, useState } from 'react';

/**
 * Magnetic Button with subtle cursor pull and smooth return.
 */
export const MagneticButton = ({ children, className = '', onClick, ...props }) => {
    const buttonRef = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);

        setOffset({
            x: x * 0.22,
            y: y * 0.22,
        });
    };

    const handleMouseLeave = () => {
        setOffset({ x: 0, y: 0 });
    };

    return (
        <button
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={`relative transition-transform duration-200 ease-out ${className}`}
            style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
            }}
            {...props}
        >
            {children}
        </button>
    );
};

export default MagneticButton;
