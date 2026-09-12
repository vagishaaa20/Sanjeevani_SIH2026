import React from 'react';

const DiagnosticStatusBadge = ({ status }) => {
    const statusConfig = {
        'REQUESTED': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
        'SCHEDULED': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
        'IN_PROGRESS': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
        'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
        'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };

    const config = statusConfig[status] || statusConfig['REQUESTED'];

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

export default DiagnosticStatusBadge;
