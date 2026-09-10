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
            bg: 'bg-amber-50 border-amber-500 text-amber-900',
            badge: 'bg-amber-200 text-amber-900 border-amber-400',
            button: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-900',
            pulse: 'bg-amber-500',
        },
        danger: {
            bg: 'bg-rose-50 border-rose-600 text-rose-950',
            badge: 'bg-rose-200 text-rose-900 border-rose-400',
            button: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-900',
            pulse: 'bg-rose-600',
        },
        info: {
            bg: 'bg-sky-50 border-cerulean text-slate-900',
            badge: 'bg-sky-200 text-cerulean-dark border-sky-300',
            button: 'bg-cerulean hover:bg-cerulean-dark text-white border-ink-black',
            pulse: 'bg-cerulean',
        },
    };

    const currentStyle = styles[severity] || styles.warning;

    return (
        <div
            className={`w-full p-4 md:p-5 rounded-2xl border-2 shadow-sm transition-all duration-200 animate-fade-in-up flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${currentStyle.bg} ${className}`}
        >
            <div className="flex items-start gap-3 flex-1">
                <div className="relative flex-shrink-0 mt-0.5">
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-ping ${currentStyle.pulse}`} />
                    <span className={`relative w-2.5 h-2.5 rounded-full inline-block ${currentStyle.pulse}`} />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${currentStyle.badge}`}>
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
                        className={`px-4 py-2 text-xs font-bold rounded-full border shadow-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap ${currentStyle.button}`}
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
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmergencyAlertBanner;
