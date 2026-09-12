import React from 'react';

export const EmergencyAlertBanner = ({
    title,
    message,
    severity = 'warning',
    icon: Icon,
    actionText,
    onAction,
    dismissible = false,
    onDismiss,
    className = '',
}) => {
    const styles = {
        warning: {
            bg: 'var(--pastel-peach-bg)',
            border: 'var(--pastel-peach-text)',
            text: 'var(--pastel-peach-text)',
            badgeBg: 'var(--pastel-peach-bg)',
            pulse: 'var(--pastel-peach-text)',
            btnBg: 'var(--pastel-peach-text)',
        },
        danger: {
            bg: 'var(--pastel-pink-bg)',
            border: 'var(--accent)',
            text: 'var(--accent)',
            badgeBg: 'var(--accent-light)',
            pulse: 'var(--accent)',
            btnBg: 'var(--accent)',
        },
        info: {
            bg: 'var(--pastel-sky-bg)',
            border: 'var(--pastel-sky-text)',
            text: 'var(--pastel-sky-text)',
            badgeBg: 'var(--pastel-sky-bg)',
            pulse: 'var(--pastel-sky-text)',
            btnBg: 'var(--pastel-sky-text)',
        },
    };

    const s = styles[severity] || styles.warning;

    return (
        <div
            className={`w-full p-4 md:p-5 rounded-2xl border-2 shadow-sm transition-all duration-200 animate-fade-in-up flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${className}`}
            style={{
                background: s.bg,
                borderColor: s.border,
                color: s.text,
            }}
        >
            <div className="flex items-start gap-3 flex-1">
                <div className="relative flex-shrink-0 mt-0.5">
                    <span
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-ping"
                        style={{ background: s.pulse }}
                    />
                    <span
                        className="relative w-2.5 h-2.5 rounded-full inline-block"
                        style={{ background: s.pulse }}
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                            style={{
                                background: s.badgeBg,
                                borderColor: s.border,
                                color: s.text,
                            }}
                        >
                            {severity === 'danger' ? 'CRITICAL OUTBREAK' : severity === 'warning' ? 'HEALTH ADVISORY' : 'ALERT'}
                        </span>
                        {title && <h4 className="text-sm font-black tracking-tight">{title}</h4>}
                    </div>
                    <p className="text-xs md:text-sm font-medium leading-relaxed opacity-90">
                        {message}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {actionText && (
                    <button
                        type="button"
                        onClick={onAction}
                        className="px-4 py-2 text-xs font-bold rounded-full shadow-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap text-white"
                        style={{ background: s.btnBg }}
                    >
                        {actionText}
                    </button>
                )}

                {dismissible && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="text-xs font-bold px-2 py-1 opacity-70 hover:opacity-100 transition cursor-pointer"
                        aria-label="Dismiss alert"
                        style={{ color: s.text }}
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmergencyAlertBanner;
