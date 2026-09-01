import React, { useEffect, useState, useCallback, useRef } from 'react';
import consultationService from '../../services/consultationService';
import AiSummaryCard from '../../components/patient/AiSummaryCard';
import SymptomTimeline from '../../components/patient/SymptomTimeline';
import MedicationReminderPanel from '../../components/patient/MedicationReminderPanel';

// ── Status badge config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    queued: { label: 'Queued', classes: 'bg-amber-100 text-amber-800 border-amber-300' },
    assigned: { label: 'Assigned', classes: 'bg-blue-100 text-blue-800 border-blue-300' },
    in_progress: { label: 'In Progress', classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' },
    completed: { label: 'Completed', classes: 'bg-teal-100 text-teal-800 border-teal-300' },
    cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700 border-red-300' },
};

// ── Star Rating Widget ─────────────────────────────────────────────────────────
function StarRating({ consultationId, doctorId, onSubmitted }) {
    const [hovered, setHovered] = useState(0);
    const [selected, setSelected] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!selected) return;
        setSubmitting(true);
        setError(null);
        try {
            await consultationService.postReview(doctorId, consultationId, selected, comment);
            onSubmitted();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-3 p-4 bg-pastel-sky-soft border border-cerulean rounded-xl flex flex-col gap-3">
            <p className="text-xs font-bold text-ink-black uppercase tracking-wide">Rate this doctor</p>
            <div className="flex gap-1" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        aria-label={`${star} star`}
                        className={`text-2xl transition-transform hover:scale-110 ${star <= (hovered || selected) ? 'text-amber-400' : 'text-zinc-300'}`}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setSelected(star)}
                    >★</button>
                ))}
            </div>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment…"
                rows={2}
                className="w-full text-sm border-2 border-zinc-200 rounded-lg p-2 resize-none focus:outline-none focus:border-cerulean"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
                type="button"
                disabled={!selected || submitting}
                onClick={handleSubmit}
                className="self-start px-4 py-1.5 text-xs font-bold bg-ink-black text-white rounded-lg disabled:opacity-40 hover:bg-cerulean-dark transition-colors"
            >
                {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
        </div>
    );
}

// ── Single consultation card ───────────────────────────────────────────────────
function ConsultationCard({ consultation, highlighted, cardRef }) {
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);
    const [reviewed, setReviewed] = useState(false);

    const badge = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.queued;

    const handleRejoin = async () => {
        setJoining(true);
        setJoinError(null);
        try {
            const data = await consultationService.rejoinCall(consultation.id);
            window.location.href = `/patient/call/${data.roomId}`;
        } catch (err) {
            setJoinError(err.response?.data?.error || 'Could not rejoin call');
            setJoining(false);
        }
    };

    const doctor = consultation.doctor || {};
    const clinic = consultation.clinic || {};
    const scheduledAt = consultation.scheduledAt
        ? new Date(consultation.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : new Date(consultation.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    // Determine if reminders banner should show: completed + prescription text exists + unconfirmed reminders
    const hasReminders = Array.isArray(consultation.medicationReminders) && consultation.medicationReminders.length > 0;
    const hasUnconfirmed = hasReminders && consultation.medicationReminders.some((r) => !r.isActive && !r.is_active);
    const showReminderPanel = consultation.status === 'completed' && (
        consultation.prescriptionText || consultation.prescriptionUrl || consultation.notes
    );

    return (
        <div
            ref={cardRef}
            id={`consultation-${consultation.id}`}
            className={`bg-white border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all ${highlighted ? 'border-cerulean shadow-lg' : 'border-ink-black'}`}
        >
            {/* Header row */}
            <div className="flex justify-between items-start gap-3">
                <div>
                    <h4 className="font-black text-ink-black">{doctor.fullName || 'Doctor'}</h4>
                    {doctor.specialization && <p className="text-xs text-ink-muted">{doctor.specialization}</p>}
                    {clinic.clinicName && (
                        <p className="text-xs text-ink-charcoal mt-0.5">
                            🏥 {clinic.clinicName}{clinic.city ? `, ${clinic.city}` : ''}
                        </p>
                    )}
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border whitespace-nowrap ${badge.classes}`}>
                    {badge.label}
                </span>
            </div>

            <p className="text-xs text-ink-muted">🕐 {scheduledAt}</p>

            {/* In-progress: rejoin call */}
            {consultation.status === 'in_progress' && (
                <div>
                    <button
                        type="button"
                        disabled={joining}
                        onClick={handleRejoin}
                        className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                        {joining ? 'Connecting…' : '📹 Rejoin Call'}
                    </button>
                    {joinError && <p className="text-xs text-red-500 mt-1">{joinError}</p>}
                </div>
            )}

            {/* Completed: prescription + rating + AI summary + reminders */}
            {consultation.status === 'completed' && (
                <div className="flex flex-col gap-2">
                    {/* Prescription link */}
                    {consultation.prescriptionUrl ? (
                        <a
                            href={consultation.prescriptionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="self-start px-4 py-1.5 text-xs font-bold border-2 border-ink-black rounded-lg hover:bg-ink-black hover:text-white transition-colors"
                        >
                            📄 View Prescription
                        </a>
                    ) : (
                        <div className="relative group self-start">
                            <button
                                type="button"
                                disabled
                                className="px-4 py-1.5 text-xs font-bold border-2 border-zinc-300 text-zinc-400 rounded-lg cursor-not-allowed"
                            >
                                📄 View Prescription
                            </button>
                            <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-ink-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                                Not available yet
                            </div>
                        </div>
                    )}

                    {/* AI Summary (lazy) */}
                    <AiSummaryCard
                        consultationId={consultation.id}
                        existingSummary={consultation.aiSummary || consultation.ai_summary}
                    />

                    {/* Medication Reminders banner/panel */}
                    {showReminderPanel && (
                        <MedicationReminderPanel
                            consultationId={consultation.id}
                            prescriptionText={consultation.prescriptionText || consultation.prescription_text || consultation.notes}
                            existingReminders={consultation.medicationReminders || []}
                        />
                    )}

                    {/* Star rating */}
                    {!reviewed && (
                        <StarRating
                            consultationId={consultation.id}
                            doctorId={consultation.doctorId}
                            onSubmitted={() => setReviewed(true)}
                        />
                    )}
                    {reviewed && (
                        <p className="text-xs text-teal-600 font-semibold">✅ Review submitted. Thank you!</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Sub-tab toggle ─────────────────────────────────────────────────────────────
const TABS = [
    { id: 'list', label: '📋 My Consultations' },
    { id: 'timeline', label: '📅 Symptom Timeline' },
];

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PatientConsultations() {
    const [activeTab, setActiveTab] = useState('list');
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [highlightedId, setHighlightedId] = useState(null);

    // Refs map for scrolling to highlighted card from timeline
    const cardRefs = useRef({});

    const fetchConsultations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await consultationService.getMyConsultations(page, 10);
            setData(result);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load consultations');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

    // When user clicks a timeline entry: switch to list tab and highlight
    const handleTimelineSelect = (consultationId) => {
        setActiveTab('list');
        setHighlightedId(consultationId);
        setTimeout(() => {
            const el = cardRefs.current[consultationId];
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 2000); // remove highlight
        }, 150);
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            {/* Page header */}
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col gap-1 shadow-sm">
                <h2 className="text-3xl font-black text-ink-black">My Consultations</h2>
                <p className="text-sm font-semibold text-ink-charcoal">
                    View your appointment history, symptom timeline, and medication reminders
                </p>
            </div>

            {/* Sub-tab toggle */}
            <div className="flex gap-2 bg-white border-2 border-ink-black rounded-2xl p-1.5 self-start">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-ink-black text-white'
                                : 'text-ink-charcoal hover:bg-zinc-100'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Timeline tab ── */}
            {activeTab === 'timeline' && (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-6">
                    <SymptomTimeline onSelect={handleTimelineSelect} />
                </div>
            )}

            {/* ── List tab ── */}
            {activeTab === 'list' && (
                <>
                    {loading && (
                        <div className="bg-white border-2 border-ink-black rounded-2xl p-8 text-center text-ink-charcoal text-sm">
                            Loading consultations…
                        </div>
                    )}
                    {error && (
                        <div className="bg-white border-2 border-red-300 rounded-2xl p-8 text-center text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    {!loading && !error && data?.consultations?.length === 0 && (
                        <div className="bg-white border-2 border-ink-black rounded-2xl p-8 text-center">
                            <p className="text-4xl mb-3">🩺</p>
                            <p className="font-bold text-ink-black">No consultations yet</p>
                            <p className="text-sm text-ink-muted mt-1">
                                Book an appointment and your consultation history will appear here.
                            </p>
                        </div>
                    )}
                    {!loading && !error && data?.consultations?.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {data.consultations.map((c) => (
                                <ConsultationCard
                                    key={c.id}
                                    consultation={c}
                                    highlighted={highlightedId === c.id}
                                    cardRef={(el) => { cardRefs.current[c.id] = el; }}
                                />
                            ))}

                            {/* Pagination */}
                            {data.totalPages > 1 && (
                                <div className="flex justify-center items-center gap-3 mt-2">
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="px-4 py-1.5 text-xs font-bold border-2 border-ink-black rounded-lg disabled:opacity-30 hover:bg-ink-black hover:text-white transition-colors"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="text-xs text-ink-charcoal font-semibold">
                                        Page {data.page} of {data.totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={page >= data.totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="px-4 py-1.5 text-xs font-bold border-2 border-ink-black rounded-lg disabled:opacity-30 hover:bg-ink-black hover:text-white transition-colors"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
