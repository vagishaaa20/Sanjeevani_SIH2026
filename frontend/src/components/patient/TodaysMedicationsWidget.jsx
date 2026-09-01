import React, { useEffect, useState, useCallback } from 'react';
import medicationReminderService from '../../services/medicationReminderService';

const STATUS_CONFIG = {
    taken: { label: 'Taken', classes: 'bg-teal-100 text-teal-700 border-teal-300' },
    upcoming: { label: 'Upcoming', classes: 'bg-amber-100 text-amber-700 border-amber-300' },
    missed: { label: 'Missed', classes: 'bg-red-100 text-red-600 border-red-300' },
};

/**
 * TodaysMedicationsWidget
 * Dashboard card showing all active medication doses for today.
 * Read-only except for the "Mark as taken" action on upcoming doses.
 */
export default function TodaysMedicationsWidget() {
    const [doses, setDoses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [marking, setMarking] = useState({}); // { [key]: true }

    const fetchToday = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await medicationReminderService.getToday();
            setDoses(data.doses || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load medications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchToday(); }, [fetchToday]);

    const handleMarkTaken = async (dose) => {
        const key = `${dose.reminderId}-${dose.time}`;
        setMarking((m) => ({ ...m, [key]: true }));
        try {
            await medicationReminderService.markTaken(dose.reminderId, dose.time);
            // Optimistic update
            setDoses((prev) =>
                prev.map((d) =>
                    d.reminderId === dose.reminderId && d.time === dose.time
                        ? { ...d, status: 'taken' }
                        : d
                )
            );
        } catch {
            // Silently revert — real status will be correct on next fetch
        } finally {
            setMarking((m) => ({ ...m, [key]: false }));
        }
    };

    return (
        <div className="bg-white border-2 border-ink-black rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">💊</span>
                <div>
                    <h3 className="text-lg font-black text-ink-black">Today's Medications</h3>
                    <p className="text-xs text-ink-muted">
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col gap-2 animate-pulse">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-14 bg-zinc-100 rounded-xl" />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Empty state */}
            {!loading && !error && doses.length === 0 && (
                <div className="py-4 text-center">
                    <p className="text-3xl mb-2">✅</p>
                    <p className="text-sm font-semibold text-ink-muted">No medications scheduled today</p>
                    <p className="text-xs text-ink-muted mt-1">
                        Activate a reminder from "My Consultations" to see doses here.
                    </p>
                </div>
            )}

            {/* Dose list */}
            {!loading && doses.length > 0 && (
                <div className="flex flex-col gap-2">
                    {doses.map((dose) => {
                        const key = `${dose.reminderId}-${dose.time}`;
                        const cfg = STATUS_CONFIG[dose.status] || STATUS_CONFIG.upcoming;
                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between gap-3 border-2 border-zinc-100 rounded-xl px-4 py-3"
                            >
                                {/* Left: medicine info */}
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <p className="font-bold text-sm text-ink-black truncate">
                                        {dose.medicineName}
                                    </p>
                                    <p className="text-[10px] text-ink-muted">
                                        {dose.dosage || '—'} · {dose.time}
                                    </p>
                                </div>

                                {/* Right: status + action */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <span
                                        className={`px-2 py-0.5 text-[9px] font-bold rounded-full border whitespace-nowrap ${cfg.classes}`}
                                    >
                                        {cfg.label}
                                    </span>

                                    {dose.status === 'upcoming' && (
                                        <button
                                            type="button"
                                            onClick={() => handleMarkTaken(dose)}
                                            disabled={marking[key]}
                                            className="px-2 py-1 text-[10px] font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                                        >
                                            {marking[key] ? '…' : 'Mark taken'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
