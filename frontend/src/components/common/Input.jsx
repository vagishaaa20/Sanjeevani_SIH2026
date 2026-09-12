import React from 'react';

export const Input = ({
    label,
    id,
    error,
    helperText,
    icon: Icon,
    className = '',
    type = 'text',
    ...props
}) => {
    return (
        <div className="flex flex-col gap-1.5 w-full text-left">
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-center">
                {Icon && (
                    <div className="absolute left-3.5 pointer-events-none" style={{ color: 'var(--text-secondary)' }}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    type={type}
                    id={id}
                    className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none shadow-xs transition duration-150 ${Icon ? 'pl-10' : ''} ${className}`}
                    style={{
                        background: 'var(--input-bg)',
                        border: error ? '1px solid #f87171' : '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                    }}
                    {...props}
                />
            </div>
            {error && <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>{error}</span>}
            {helperText && !error && <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{helperText}</span>}
        </div>
    );
};

export default Input;
