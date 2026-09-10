import React from 'react';

export const Table = ({ headers, children, emptyState, className = '' }) => {
    const hasChildren = React.Children.count(children) > 0;

    return (
        <div className={`overflow-x-auto w-full border border-[#f5e4ec] rounded-2xl bg-white shadow-xs ${className}`}>
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr className="bg-[#fdf0f4] border-b border-[#f5e4ec]">
                        {headers.map((h, i) => (
                            <th key={i} className="px-5 py-3 text.5 text-[11px] font-black text-[#7d6974] uppercase tracking-wider">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f5e4ec]/60">
                    {hasChildren ? (
                        children
                    ) : emptyState ? (
                        <tr>
                            <td colSpan={headers.length} className="px-5 py-8 text-center text-[#7d6974]">
                                {emptyState}
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
