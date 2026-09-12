import React, { useEffect, useState } from 'react';
import consultationService from '../../services/consultationService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso) {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * SymptomTimeline
 * A vertical timeline of the patient's consultation history.
 * Each entry is clickable — notifies the parent (via onSelect) to scroll/expand
 * the corresponding ConsultationCard in the list view.
 *
 * Props:
 *   onSelect {function(consultationId: string)} — called when user clicks an entry
 */
export default function SymptomTimeline({ onSelect }) {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        consultationService.getTimeline()
            .then((data) => setTimeline(data.timeline || []))
            .catch((err) => setError(err.response?.data?.error || 'Could not load timeline'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="py-8 text-center text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Loading timeline…
        </div>
    );

    if (error) return (
        <div className="py-4 text-center text-sm" style={{ color: 'var(--accent)' }}>{error}</div>
    );

    if (timeline.length === 0) return (
        <div className="py-8 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No completed consultations to show yet.</p>
        </div>
    );

    return (
        <div className="relative flex flex-col gap-0">
            {/* Vertical connector line */}
            <div
                className="absolute left-[72px] top-4 bottom-4 w-0.5 z-0"
                style={{ background: 'var(--border)' }}
                aria-hidden="true"
            />

            {timeline.map((entry, idx) => (
                <button
                    key={entry.consultationId}
                    type="button"
                    onClick={() => onSelect?.(entry.consultationId)}
                    className="relative z-10 flex items-start gap-4 text-left group py-4 px-2 rounded-xl transition-colors cursor-pointer hover:bg-[var(--accent-light)]"
                    title="Click to view full record"
                >
                    {/* Date column */}
                    <div className="w-16 shrink-0 flex flex-col items-center">
                        <div
                            className="w-3 h-3 rounded-full border-2 mt-1 shrink-0 transition-colors"
                            style={{
                                background: idx === timeline.length - 1 ? 'var(--pastel-mint-text)' : 'var(--card-bg)',
                                borderColor: idx === timeline.length - 1 ? 'var(--pastel-mint-text)' : 'var(--pastel-mint-text)'
                            }}
                        />
                        <p className="text-[9px] font-bold mt-1 text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(entry.date)}
                        </p>
                    </div>

                    {/* Content column */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>
                                {entry.doctor}
                            </p>
                            {entry.specialization && (
                                <span
                                    className="text-[9px] font-semibold border rounded-full px-1.5 py-0.5"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    {entry.specialization}
                                </span>
                            )}
                        </div>

                        {entry.reportedSymptoms && (
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Symptoms: </span>
                                {entry.reportedSymptoms}
                            </p>
                        )}

                        {entry.diagnosis && (
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--pastel-mint-text)' }}>
                                <span className="font-semibold">Outcome: </span>
                                {entry.diagnosis}
                            </p>
                        )}

                        <span className="text-[9px] font-bold group-hover:underline mt-0.5" style={{ color: 'var(--accent)' }}>
                            View full record →
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
}
