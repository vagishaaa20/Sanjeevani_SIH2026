import React, { useState } from 'react';
import consultationService from '../../services/consultationService';

/**
 * AiSummaryCard
 * Displayed under a completed consultation entry.
 * Summary is generated on-demand (lazy) and cached server-side.
 *
 * Props:
 *   consultationId {string}
 *   existingSummary {string|null} — pre-cached summary from consultation list response
 */
export default function AiSummaryCard({ consultationId, existingSummary }) {
    const [summary, setSummary] = useState(existingSummary || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generated, setGenerated] = useState(!!existingSummary);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await consultationService.generateSummary(consultationId);
            setSummary(data.aiSummary);
            setGenerated(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not generate summary');
        } finally {
            setLoading(false);
        }
    };

    // No notes / prescription on server — don't show anything
    if (generated && !summary) return null;

    return (
        <div className="mt-3 bg-gradient-to-r from-sky-50 to-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col gap-2">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-base" aria-hidden="true">🤖</span>
                    <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">
                        AI-generated Summary
                    </p>
                </div>
                {!generated && (
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={loading}
                        className="text-[10px] font-bold text-cerulean-dark border border-cerulean rounded-lg px-2 py-0.5 hover:bg-cerulean hover:text-white transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Generating…' : 'Generate Summary'}
                    </button>
                )}
            </div>

            {/* Skeleton while loading */}
            {loading && (
                <div className="flex flex-col gap-1.5 animate-pulse">
                    <div className="h-3 bg-teal-200 rounded w-full" />
                    <div className="h-3 bg-teal-200 rounded w-5/6" />
                    <div className="h-3 bg-teal-200 rounded w-3/4" />
                </div>
            )}

            {/* Summary text */}
            {!loading && summary && (
                <p className="text-sm text-ink-charcoal leading-relaxed">{summary}</p>
            )}

            {/* Error */}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
