import React from 'react';

export const StatusIndicator = ({
    status = 'active',
    label,
    pulse = true,
    className = '',
}) => {
    const statuses = {
        active: {
            bg: 'bg-emerald-500',
            text: 'text-emerald-800',
            wrapper: 'bg-emerald-50 border-emerald-300',
        },
        online: {
            bg: 'bg-emerald-500',
            text: 'text-emerald-800',
            wrapper: 'bg-emerald-50 border-emerald-300',
        },
        waiting: {
            bg: 'bg-amber-500',
            text: 'text-amber-800',
            wrapper: 'bg-amber-50 border-amber-300',
        },
        in_progress: {
            bg: 'bg-cerulean',
            text: 'text-cerulean-dark',
            wrapper: 'bg-sky-50 border-sky-300',
        },
        urgent: {
            bg: 'bg-rose-500',
            text: 'text-rose-800',
            wrapper: 'bg-rose-50 border-rose-300',
        },
        offline: {
            bg: 'bg-gray-400',
            text: 'text-gray-700',
            wrapper: 'bg-gray-100 border-gray-300',
        },
    };

    const current = statuses[status] || statuses.active;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tracking-tight ${current.wrapper} ${className}`}
        >
            <span className="relative flex h-2 w-2">
                {pulse && (
                    <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.bg}`}
                    />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${current.bg}`} />
            </span>
            {label && <span className={current.text}>{label}</span>}
        </span>
    );
};

export default StatusIndicator;
