import React from 'react';

export const Table = ({ headers, children, emptyState, className = '' }) => {
    const hasChildren = React.Children.count(children) > 0;

    return (
        <div
            className={`overflow-x-auto w-full rounded-2xl shadow-xs ${className}`}
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
            }}
        >
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className="px-5 py-3 text-[11px] font-black uppercase tracking-wider"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {hasChildren ? (
                        children
                    ) : emptyState ? (
                        <tr>
                            <td
                                colSpan={headers.length}
                                className="px-5 py-8 text-center"
                                style={{ color: 'var(--text-secondary)' }}
                            >
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
