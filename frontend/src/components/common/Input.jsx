import React from 'react';

export const Input = ({ label, id, error, className = '', type = 'text', ...props }) => {
    return (
        <div className="flex flex-col gap-1 w-full text-left">
            {label && (
                <label htmlFor={id} className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                    {label}
                </label>
            )}
            <input
                type={type}
                id={id}
                className={`w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:outline-none focus:ring-2 focus:ring-rose-mauve transition duration-150 ${error ? 'border-red-500 ring-2 ring-red-200' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        </div>
    );
};

export default Input;
