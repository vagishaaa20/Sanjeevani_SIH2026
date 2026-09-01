import React from 'react';

export const Table = ({ headers, children, className = '' }) => {
    return (
        <div className={`overflow-x-auto w-full border border-ink-black rounded-xl bg-white ${className}`}>
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="bg-cream-surface border-b border-ink-black">
                        {headers.map((h, i) => (
                            <th key={i} className="px-5 py-3 text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-cream-surface">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
