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
        pink: 'bg-[#ffe6ee] text-[#e13b68]',
        peach: 'bg-[#fff0e6] text-[#e07a38]',
        lavender: 'bg-[#f3e8ff] text-[#7c3aed]',
        mint: 'bg-[#e6f9f0] text-[#10b981]',
        sky: 'bg-[#e8f4fa] text-[#1e7ab8]',
        default: 'bg-[#fdf0f4] text-[#e13b68]',
    };

    const subtextColors = {
        pink: 'text-[#e13b68]',
        peach: 'text-[#e07a38]',
        lavender: 'text-[#7c3aed]',
        mint: 'text-[#10b981]',
        sky: 'text-[#1e7ab8]',
        default: 'text-[#7d6974]',
    };

    return (
        <div
            className={`p-5 rounded-2xl bg-white border border-[#f5e4ec] shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${className}`}
        >
            <div className="flex items-center gap-3 mb-3">
                {Icon && (
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgs[variant] || iconBgs.pink}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <div className="flex flex-col text-left">
                    <p className="text-xs font-bold text-[#7d6974] tracking-tight">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl md:text-3xl font-black text-[#2d2329] tracking-tight font-heading">
                            {value}
                        </span>
                        {unit && (
                            <span className="text-xs font-bold text-[#7d6974]">
                                {unit}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {(description || trend) && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#f8e7ee]/60">
                    {description && (
                        <span className={`text-[11px] font-bold ${subtextColors[variant] || subtextColors.pink}`}>
                            {description}
                        </span>
                    )}

                    {trend && (
                        <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-0.5 ${
                                trendDirection === 'up'
                                    ? 'bg-[#e6f9f0] text-[#10b981]'
                                    : trendDirection === 'down'
                                    ? 'bg-[#ffe6ee] text-[#e13b68]'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
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
