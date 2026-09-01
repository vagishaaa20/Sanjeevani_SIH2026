import React, { useState } from 'react';
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
 *
 * Props:
 *   consultationId {string}
 *   prescriptionText {string|null} — raw text for extraction
 *   existingReminders {Array}      — already-extracted rows (if any)
 *   onActivated {function}         — callback fired after any reminder is activated
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
            setReminders((prev) => prev.map((r) => r.id === reminder.id ? { ...r, isActive: true, is_active: true } : r));
            setActionState((s) => ({ ...s, [reminder.id]: 'done' }));
            onActivated?.();
        } catch {
            setActionState((s) => ({ ...s, [reminder.id]: 'error' }));
        }
    };

    // ── Banner state — no reminders extracted yet ────────────────────────────
    if (!reminders.length) {
        return (
            <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">💊</span>
                    <p className="text-xs font-bold text-amber-800">Medication Reminders Available</p>
                </div>
                <p className="text-[11px] text-amber-700">
                    Sanjeevani can automatically extract your medicines and set up daily reminders via WhatsApp.
                </p>
                {extractError && <p className="text-xs text-red-500">{extractError}</p>}
                <button
                    type="button"
                    onClick={handleExtract}
                    disabled={extracting}
                    className="self-start px-3 py-1.5 text-xs font-bold bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors disabled:opacity-50"
                >
                    {extracting ? 'Extracting…' : '✨ Extract & Set Reminders'}
                </button>
            </div>
        );
    }

    // ── Reminder list ────────────────────────────────────────────────────────
    return (
        <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col gap-4">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                💊 Medication Reminders — Review & Confirm
            </p>

            {reminders.map((r) => {
                const isActive = r.isActive || r.is_active;
                const times = r.reminderTimes || r.reminder_times || ['09:00'];
                const state = actionState[r.id];

                return (
                    <div
                        key={r.id}
                        className={`bg-white border-2 rounded-xl p-3 flex flex-col gap-2 ${isActive ? 'border-teal-400' : 'border-amber-200'}`}
                    >
                        {/* Medicine name */}
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-ink-black">{r.medicineName || r.medicine_name}</p>
                            {isActive && (
                                <span className="text-[9px] font-bold text-teal-700 bg-teal-100 border border-teal-300 rounded-full px-2 py-0.5">
                                    ✅ ACTIVE
                                </span>
                            )}
                        </div>

                        {!isActive && (
                            <>
                                {/* Dosage */}
                                <div className="flex gap-2 items-center">
                                    <label className="text-[10px] font-bold text-ink-muted w-16">Dosage</label>
                                    <input
                                        type="text"
                                        value={r.dosage || ''}
                                        onChange={(e) => handleFieldChange(r.id, 'dosage', e.target.value)}
                                        placeholder="e.g. 500mg"
                                        className="flex-1 text-xs border-2 border-zinc-200 rounded-lg p-1.5 focus:outline-none focus:border-cerulean"
                                    />
                                </div>

                                {/* Frequency */}
                                <div className="flex gap-2 items-center">
                                    <label className="text-[10px] font-bold text-ink-muted w-16">Frequency</label>
                                    <select
                                        value={r.frequency || 'once_daily'}
                                        onChange={(e) => handleFieldChange(r.id, 'frequency', e.target.value)}
                                        className="flex-1 text-xs border-2 border-zinc-200 rounded-lg p-1.5 focus:outline-none focus:border-cerulean"
                                    >
                                        {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                                            <option key={v} value={v}>{l}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reminder times */}
                                <div className="flex gap-2 items-center">
                                    <label className="text-[10px] font-bold text-ink-muted w-16">Time(s)</label>
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
                                        className="flex-1 text-xs border-2 border-zinc-200 rounded-lg p-1.5 focus:outline-none focus:border-cerulean"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleSave(r)}
                                        disabled={state === 'saving'}
                                        className="px-3 py-1.5 text-[10px] font-bold border-2 border-ink-black rounded-lg hover:bg-ink-black hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved ✓' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleActivate(r)}
                                        disabled={state === 'activating'}
                                        className="px-3 py-1.5 text-[10px] font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                                    >
                                        {state === 'activating' ? 'Activating…' : state === 'done' ? 'Done ✅' : 'Activate Reminders'}
                                    </button>
                                </div>
                                {state === 'error' && (
                                    <p className="text-[10px] text-red-500">Action failed. Please try again.</p>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
