import React from 'react';

export const StatCard = ({
    title,
    value,
    unit = '',
    icon: Icon,
    trend,
    trendDirection = 'up',
    description,
    variant = 'pink', // 'pink', 'peach', 'lavender', 'mint', 'sky'
    className = '',
}) => {
    const iconBgs = {
        pink: { bg: 'var(--pastel-pink-bg)', color: 'var(--pastel-pink-text)' },
        peach: { bg: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)' },
        lavender: { bg: 'var(--pastel-lavender-bg)', color: 'var(--pastel-lavender-text)' },
        mint: { bg: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)' },
        sky: { bg: 'var(--pastel-sky-bg)', color: 'var(--pastel-sky-text)' },
        default: { bg: 'var(--bg-surface)', color: 'var(--accent)' },
    };

    const subtextColors = {
        pink: 'var(--pastel-pink-text)',
        peach: 'var(--pastel-peach-text)',
        lavender: 'var(--pastel-lavender-text)',
        mint: 'var(--pastel-mint-text)',
        sky: 'var(--pastel-sky-text)',
        default: 'var(--text-secondary)',
    };

    const iconStyle = iconBgs[variant] || iconBgs.default;

    return (
        <div
            className={`p-5 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${className}`}
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
        >
            <div className="flex items-center gap-3 mb-3">
                {Icon && (
                    <div
                        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: iconStyle.bg, color: iconStyle.color }}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <div className="flex flex-col text-left">
                    <p className="text-xs font-bold tracking-tight" style={{ color: 'var(--text-secondary)' }}>
                        {title}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl md:text-3xl font-black tracking-tight font-heading" style={{ color: 'var(--text-primary)' }}>
                            {value}
                        </span>
                        {unit && (
                            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                                {unit}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {(description || trend) && (
                <div
                    className="flex items-center justify-between text-xs pt-1 border-t"
                    style={{ borderColor: 'var(--border-subtle)' }}
                >
                    {description && (
                        <span className="text-[11px] font-bold" style={{ color: subtextColors[variant] || subtextColors.default }}>
                            {description}
                        </span>
                    )}

                    {trend && (
                        <span
                            className="px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-0.5"
                            style={
                                trendDirection === 'up'
                                    ? { background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)' }
                                    : trendDirection === 'down'
                                        ? { background: 'var(--pastel-pink-bg)', color: 'var(--pastel-pink-text)' }
                                        : { background: 'var(--bg-surface)', color: 'var(--text-secondary)' }
                            }
                        >
                            {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '•'} {trend}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatCard;
