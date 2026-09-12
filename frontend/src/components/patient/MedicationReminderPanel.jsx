import React, { useState } from 'react';
import { Pill, Sparkles, Check, CheckCircle2, Clock, Plus, Loader2 } from 'lucide-react';
import medicationReminderService from '../../services/medicationReminderService';

const FREQUENCY_LABELS = {
    once_daily: 'Once a day',
    twice_daily: 'Twice a day',
    three_times_daily: '3× a day',
    four_times_daily: '4× a day',
    as_needed: 'As needed',
};

/**
 * MedicationReminderPanel
 * Shown inside a completed ConsultationCard when there are unactivated reminders.
 * Lets the patient review Gemini-extracted meds, edit dosage/times, then activate.
 */
export default function MedicationReminderPanel({
    consultationId,
    prescriptionText,
    existingReminders = [],
    onActivated,
}) {
    const [reminders, setReminders] = useState(existingReminders);
    const [extracting, setExtracting] = useState(false);
    const [extractError, setExtractError] = useState(null);
    const [actionState, setActionState] = useState({}); // { [id]: 'saving'|'activating'|'done'|'error' }

    const handleExtract = async () => {
        setExtracting(true);
        setExtractError(null);
        try {
            const data = await medicationReminderService.extract(consultationId, prescriptionText);
            if (data.reminders?.length) {
                setReminders(data.reminders);
            } else {
                setExtractError('No medications found in prescription text.');
            }
        } catch (err) {
            setExtractError(err.response?.data?.error || 'Extraction failed');
        } finally {
            setExtracting(false);
        }
    };

    const handleFieldChange = (id, field, value) => {
        setReminders((prev) =>
            prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
        );
    };

    const handleSave = async (reminder) => {
        setActionState((s) => ({ ...s, [reminder.id]: 'saving' }));
        try {
            await medicationReminderService.update(reminder.id, {
                dosage: reminder.dosage,
                frequency: reminder.frequency,
                reminderTimes: reminder.reminderTimes || reminder.reminder_times,
            });
            setActionState((s) => ({ ...s, [reminder.id]: 'saved' }));
            setTimeout(() => setActionState((s) => ({ ...s, [reminder.id]: null })), 1500);
        } catch {
            setActionState((s) => ({ ...s, [reminder.id]: 'error' }));
        }
    };

    const handleActivate = async (reminder) => {
        setActionState((s) => ({ ...s, [reminder.id]: 'activating' }));
        try {
            await medicationReminderService.activate(reminder.id);
            setReminders((prev) =>
                prev.map((r) => (r.id === reminder.id ? { ...r, isActive: true, is_active: true } : r))
            );
            setActionState((s) => ({ ...s, [reminder.id]: 'done' }));
            onActivated?.();
        } catch {
            setActionState((s) => ({ ...s, [reminder.id]: 'error' }));
        }
    };

    // ── Banner state — no reminders extracted yet ────────────────────────────
    if (!reminders.length) {
        return (
            <div
                className="border rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5 shadow-2xs"
                style={{ background: 'var(--pastel-peach-bg)', borderColor: 'var(--pastel-peach-text)' }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--pastel-peach-text)', color: 'var(--pastel-peach-text)' }}
                    >
                        <Pill className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--pastel-peach-text)' }}>
                        Medication Reminders Available
                    </p>
                </div>
                <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    Sanjeevani can automatically extract your prescribed medicines and set up daily reminder notifications via WhatsApp.
                </p>
                {extractError && <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{extractError}</p>}
                <button
                    type="button"
                    onClick={handleExtract}
                    disabled={extracting}
                    className="self-start px-4 py-2 text-xs font-black rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer mt-1"
                    style={{ background: 'var(--pastel-peach-text)', color: 'white' }}
                >
                    {extracting ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Extracting Prescribed Meds...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Extract &amp; Set Reminders</span>
                        </>
                    )}
                </button>
            </div>
        );
    }

    // ── Reminder list ────────────────────────────────────────────────────────
    return (
        <div
            className="border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xs"
            style={{ background: 'var(--pastel-peach-bg)', borderColor: 'var(--pastel-peach-text)' }}
        >
            <div className="flex items-center gap-2">
                <Pill className="w-4 h-4" style={{ color: 'var(--pastel-peach-text)' }} />
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--pastel-peach-text)' }}>
                    Medication Reminders — Review &amp; Confirm
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {reminders.map((r) => {
                    const isActive = r.isActive || r.is_active;
                    const times = r.reminderTimes || r.reminder_times || ['09:00'];
                    const state = actionState[r.id];

                    return (
                        <div
                            key={r.id}
                            className={`border rounded-2xl p-4 flex flex-col gap-3 transition shadow-2xs`}
                            style={{
                                background: isActive ? 'var(--pastel-mint-bg)' : 'var(--card-bg)',
                                borderColor: isActive ? 'var(--pastel-mint-text)' : 'var(--border)'
                            }}
                        >
                            {/* Medicine name */}
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {r.medicineName || r.medicine_name}
                                </p>
                                {isActive && (
                                    <span
                                        className="text-[10px] font-black border rounded-full px-2.5 py-0.5 flex items-center gap-1"
                                        style={{ color: 'var(--pastel-mint-text)', background: 'var(--bg-surface)', borderColor: 'var(--pastel-mint-text)' }}
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>ACTIVE</span>
                                    </span>
                                )}
                            </div>

                            {!isActive && (
                                <div className="flex flex-col gap-2.5 pt-1">
                                    {/* Dosage */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold w-20" style={{ color: 'var(--text-secondary)' }}>Dosage</label>
                                        <input
                                            type="text"
                                            value={r.dosage || ''}
                                            onChange={(e) => handleFieldChange(r.id, 'dosage', e.target.value)}
                                            placeholder="e.g. 500mg"
                                            className="flex-1 text-xs border rounded-xl px-3 py-1.5 focus:outline-none transition"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', outlineColor: 'var(--accent)' }}
                                        />
                                    </div>

                                    {/* Frequency */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold w-20" style={{ color: 'var(--text-secondary)' }}>Frequency</label>
                                        <select
                                            value={r.frequency || 'once_daily'}
                                            onChange={(e) => handleFieldChange(r.id, 'frequency', e.target.value)}
                                            className="flex-1 text-xs border rounded-xl px-3 py-1.5 focus:outline-none transition cursor-pointer"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', outlineColor: 'var(--accent)' }}
                                        >
                                            {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                                                <option key={v} value={v}>
                                                    {l}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Reminder times */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold w-20" style={{ color: 'var(--text-secondary)' }}>Time(s)</label>
                                        <input
                                            type="text"
                                            value={times.join(', ')}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    r.id,
                                                    'reminderTimes',
                                                    e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                                                )
                                            }
                                            placeholder="09:00, 21:00"
                                            className="flex-1 text-xs border rounded-xl px-3 py-1.5 focus:outline-none transition"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', outlineColor: 'var(--accent)' }}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleSave(r)}
                                            disabled={state === 'saving'}
                                            className="px-3.5 py-1.5 text-xs font-bold border rounded-full transition cursor-pointer disabled:opacity-50"
                                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        >
                                            {state === 'saving' ? 'Saving...' : state === 'saved' ? 'Saved ✓' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleActivate(r)}
                                            disabled={state === 'activating'}
                                            className="px-4 py-1.5 text-xs font-black text-white rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                                            style={{ background: 'var(--pastel-mint-text)' }}
                                        >
                                            {state === 'activating' ? 'Activating...' : state === 'done' ? 'Active ✓' : 'Activate Reminders'}
                                        </button>
                                    </div>
                                    {state === 'error' && (
                                        <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Action failed. Please try again.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
