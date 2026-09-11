import React, { useEffect, useState, useCallback } from 'react';
import medicationReminderService from '../../services/medicationReminderService';
import { Pill, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Badge from '../common/Badge';

const STATUS_CONFIG = {
    taken: { label: 'Taken', variant: 'mint' },
    upcoming: { label: 'Upcoming', variant: 'peach' },
    missed: { label: 'Missed', variant: 'pink' },
};

export default function TodaysMedicationsWidget() {
    const [doses, setDoses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [marking, setMarking] = useState({});

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
            setDoses((prev) =>
                prev.map((d) =>
                    d.reminderId === dose.reminderId && d.time === dose.time
                        ? { ...d, status: 'taken' }
                        : d
                )
            );
        } catch {
            // Silently revert on next fetch
        } finally {
            setMarking((m) => ({ ...m, [key]: false }));
        }
    };

    return (
        <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-4 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#fdf0f4] pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                        <Pill className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#2d2329] font-heading">Today's Medications</h3>
                        <p className="text-xs text-[#7d6974] font-medium">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                <Badge variant="pink">
                    Daily Schedule
                </Badge>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col gap-2.5 animate-pulse">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-[#fffcfd] border border-[#f5e4ec] rounded-2xl" />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && doses.length === 0 && (
                <div className="py-6 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#2d2329]">No medications scheduled today</p>
                    <p className="text-xs text-[#7d6974] font-medium max-w-sm">
                        Medication doses prescribed during consultations will appear here automatically with time reminders.
                    </p>
                </div>
            )}

            {/* Dose list */}
            {!loading && doses.length > 0 && (
                <div className="flex flex-col gap-2.5">
                    {doses.map((dose) => {
                        const key = `${dose.reminderId}-${dose.time}`;
                        const cfg = STATUS_CONFIG[dose.status] || STATUS_CONFIG.upcoming;
                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between gap-3 bg-[#fffcfd] border border-[#f5e4ec] hover:border-[#f5c6d6] rounded-2xl px-4 py-3.5 transition shadow-2xs"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center flex-shrink-0">
                                        <Pill className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="font-bold text-xs md:text-sm text-[#2d2329]">
                                            {dose.medicineName}
                                        </p>
                                        <p className="text-[11px] text-[#7d6974] font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-[#7d6974]" />
                                            <span>{dose.dosage || 'Standard dose'} · {dose.time}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                    <Badge variant={cfg.variant}>
                                        {cfg.label}
                                    </Badge>

                                    {dose.status === 'upcoming' && (
                                        <button
                                            type="button"
                                            onClick={() => handleMarkTaken(dose)}
                                            disabled={marking[key]}
                                            className="px-3.5 py-1.5 text-xs font-bold bg-[#e13b68] hover:bg-[#c92a55] text-white rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>{marking[key] ? 'Saving…' : 'Mark taken'}</span>
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
