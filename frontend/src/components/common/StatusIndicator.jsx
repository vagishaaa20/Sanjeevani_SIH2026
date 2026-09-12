import React from 'react';

export const StatusIndicator = ({
    status = 'active',
    label,
    pulse = true,
    className = '',
}) => {
    const statuses = {
        active: {
            bg: 'var(--pastel-mint-text)',
            text: 'var(--pastel-mint-text)',
            wrapperBg: 'var(--pastel-mint-bg)',
            wrapperBorder: 'var(--pastel-mint-text)',
        },
        online: {
            bg: 'var(--pastel-mint-text)',
            text: 'var(--pastel-mint-text)',
            wrapperBg: 'var(--pastel-mint-bg)',
            wrapperBorder: 'var(--pastel-mint-text)',
        },
        waiting: {
            bg: 'var(--pastel-peach-text)',
            text: 'var(--pastel-peach-text)',
            wrapperBg: 'var(--pastel-peach-bg)',
            wrapperBorder: 'var(--pastel-peach-text)',
        },
        in_progress: {
            bg: 'rgb(59, 130, 246)',
            text: 'rgb(59, 130, 246)',
            wrapperBg: 'rgba(59, 130, 246, 0.1)',
            wrapperBorder: 'rgb(59, 130, 246)',
        },
        urgent: {
            bg: 'var(--accent)',
            text: 'var(--accent)',
            wrapperBg: 'var(--pastel-pink-bg)',
            wrapperBorder: 'var(--accent)',
        },
        offline: {
            bg: 'var(--text-muted)',
            text: 'var(--text-muted)',
            wrapperBg: 'var(--bg-surface)',
            wrapperBorder: 'var(--text-muted)',
        },
    };

    const current = statuses[status] || statuses.active;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tracking-tight ${className}`}
            style={{ background: current.wrapperBg, borderColor: current.wrapperBorder }}
        >
            <span className="relative flex h-2 w-2">
                {pulse && (
                    <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: current.bg }}
                    />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: current.bg }} />
            </span>
            {label && <span style={{ color: current.text }}>{label}</span>}
        </span>
    );
};

export default StatusIndicator;
