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
                <label htmlFor={id} className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-center">
                {Icon && (
                    <div className="absolute left-3.5 text-[#7d6974] pointer-events-none">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    type={type}
                    id={id}
                    className={`w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] placeholder:text-[#7d6974]/50 focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] shadow-xs transition duration-150 ${
                        Icon ? 'pl-10' : ''
                    } ${error ? 'border-rose-400 ring-2 ring-rose-100' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && <span className="text-xs text-rose-600 font-semibold">{error}</span>}
            {helperText && !error && <span className="text-xs text-[#7d6974] font-medium">{helperText}</span>}
        </div>
    );
};

export default Input;
