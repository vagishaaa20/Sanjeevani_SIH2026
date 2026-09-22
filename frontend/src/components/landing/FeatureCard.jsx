import React from 'react';

export const FeatureCard = ({ icon: Icon, title, description, benefits }) => {
    return (
        <div className="relative group rounded-3xl p-6 md:p-8 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-default flex flex-col h-full"
             style={{ 
                 background: 'var(--card-bg)', 
                 border: '1px solid var(--border)',
                 boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
             }}>
            {/* Subtle Gradient Background on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                 style={{ background: 'linear-gradient(135deg, var(--accent) 0%, transparent 100%)' }} />

            <div className="relative z-10 flex flex-col h-full">
                {/* Icon Container */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm"
                     style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                    <Icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-black mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {title}
                </h3>
                <p className="text-sm font-medium leading-relaxed mb-6 flex-grow" style={{ color: 'var(--text-secondary)' }}>
                    {description}
                </p>

                {/* Feature List */}
                {benefits && benefits.length > 0 && (
                    <ul className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        {benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                                <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)', opacity: 0.8 }} />
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default FeatureCard;
