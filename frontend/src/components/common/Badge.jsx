import React from 'react';

export const Badge = ({ children, variant = 'info', dot = false, pulse = false, className = '' }) => {
    const styles = {
        info: { bg: 'var(--pastel-pink-bg)', color: 'var(--pastel-pink-text)', border: 'var(--notif-unread-border)' },
        pink: { bg: 'var(--pastel-pink-bg)', color: 'var(--pastel-pink-text)', border: 'var(--notif-unread-border)' },
        success: { bg: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)', border: 'var(--pastel-mint-bg)' },
        mint: { bg: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)', border: 'var(--pastel-mint-bg)' },
        warning: { bg: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)', border: 'var(--pastel-peach-bg)' },
        peach: { bg: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)', border: 'var(--pastel-peach-bg)' },
        danger: { bg: 'var(--pastel-lavender-bg)', color: 'var(--pastel-lavender-text)', border: 'var(--pastel-lavender-bg)' },
        lavender: { bg: 'var(--pastel-lavender-bg)', color: 'var(--pastel-lavender-text)', border: 'var(--pastel-lavender-bg)' },
        emergency: { bg: 'var(--accent)', color: '#ffffff', border: 'transparent' },
        muted: { bg: 'var(--bg-surface)', color: 'var(--text-secondary)', border: 'var(--border)' },
    };

    const s = styles[variant] || styles.info;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full border tracking-tight ${className}`}
            style={{ background: s.bg, color: s.color, borderColor: s.border }}
        >
            {dot && (
                <span className="relative flex h-2 w-2">
                    {pulse && (
                        <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ background: s.color }}
                        />
                    )}
                    <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ background: s.color }}
                    />
                </span>
            )}
            {children}
        </span>
    );
};

export default Badge;
