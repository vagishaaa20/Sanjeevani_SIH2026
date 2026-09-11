import React, { useState } from 'react';
import { Bot, Sparkles, Loader2, FileText, CheckCircle } from 'lucide-react';
import consultationService from '../../services/consultationService';

/**
 * AiSummaryCard
 * Displayed under a completed consultation entry.
 * Summary is generated on-demand (lazy) and cached server-side.
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
            setError(err.response?.data?.error || 'Could not generate AI clinical summary');
        } finally {
            setLoading(false);
        }
    };

    if (generated && !summary) return null;

    return (
        <div className="bg-[#fff9fb] border border-[#f8c8d8] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68]">
                        <Bot className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-black text-[#e13b68] uppercase tracking-wider">
                        AI Clinical Summary
                    </p>
                </div>

                {!generated && (
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={loading}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#e13b68] text-white hover:bg-[#c92a55] transition shadow-2xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Generate Summary</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Skeleton while loading */}
            {loading && (
                <div className="flex flex-col gap-2 animate-pulse pt-2">
                    <div className="h-3.5 bg-[#fce4ec] rounded-md w-full" />
                    <div className="h-3.5 bg-[#fce4ec] rounded-md w-5/6" />
                    <div className="h-3.5 bg-[#fce4ec] rounded-md w-3/4" />
                </div>
            )}

            {/* Summary text */}
            {!loading && summary && (
                <div className="pt-1">
                    <p className="text-xs sm:text-sm text-[#4a3c45] font-semibold leading-relaxed">
                        {summary}
                    </p>
                </div>
            )}

            {/* Error */}
            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        </div>
    );
}
