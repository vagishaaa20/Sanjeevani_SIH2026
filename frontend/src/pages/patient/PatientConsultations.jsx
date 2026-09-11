import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    User,
    Building2,
    Download,
    Video,
    ShieldCheck,
    Star,
    Sparkles,
    CheckCircle2,
    Search,
    ChevronRight,
    FileText,
    ArrowRight,
    Activity,
    ExternalLink
} from 'lucide-react';
import consultationService from '../../services/consultationService';
import AiSummaryCard from '../../components/patient/AiSummaryCard';
import SymptomTimeline from '../../components/patient/SymptomTimeline';
import MedicationReminderPanel from '../../components/patient/MedicationReminderPanel';

// ── Status badge config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    queued: { label: 'Queued', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    assigned: { label: 'Assigned', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
    in_progress: { label: 'In Progress', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse' },
    completed: { label: 'Completed', bg: 'bg-teal-50 text-teal-800 border-teal-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
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
        <div className="bg-[#fffbf0] border border-[#fde68a] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
                <p className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Rate Your Consultation Experience
                </p>
                <span className="text-[11px] font-semibold text-amber-800">
                    {selected > 0 ? `${selected} of 5 Stars` : 'Select a rating'}
                </span>
            </div>

            <div className="flex items-center gap-1.5" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        aria-label={`${star} star`}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer text-2xl focus:outline-none"
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setSelected(star)}
                    >
                        <Star
                            className={`w-6 h-6 transition-colors ${
                                star <= (hovered || selected)
                                    ? 'fill-[#f59e0b] text-[#f59e0b]'
                                    : 'text-[#e2d6dc] fill-none'
                            }`}
                        />
                    </button>
                ))}
            </div>

            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share doctor feedback (e.g. empathy, clarity of advice, prescription accuracy)..."
                rows={2}
                className="w-full text-xs border border-[#f5e4ec] rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 focus:border-[#e13b68] bg-white text-[#1c1218]"
            />

            {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}

            <button
                type="button"
                disabled={!selected || submitting}
                onClick={handleSubmit}
                className="self-start px-5 py-2 text-xs font-black bg-[#e13b68] text-white hover:bg-[#c92a55] rounded-full disabled:opacity-40 transition-all shadow-xs cursor-pointer"
            >
                {submitting ? 'Submitting Review...' : 'Submit Verified Review'}
            </button>
        </div>
    );
}

// ── Single consultation card ───────────────────────────────────────────────────
function ConsultationCard({ consultation, highlighted, cardRef }) {
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);
    const [reviewed, setReviewed] = useState(false);
    const [prescInfo, setPrescInfo] = useState(null);
    const [prescLoading, setPrescLoading] = useState(false);

    const badge = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.queued;

    const fetchPrescriptionStatus = useCallback(async () => {
        if (prescInfo || prescLoading) return;
        setPrescLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
            const res = await fetch(`${API_BASE}/consultations/${consultation.id}/prescription`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPrescInfo(data);
            }
        } catch (e) {
            console.error('[PrescInfo] fetch error', e);
        } finally {
            setPrescLoading(false);
        }
    }, [consultation.id, prescInfo, prescLoading]);

    useEffect(() => {
        if (consultation.status === 'completed') fetchPrescriptionStatus();
    }, [consultation.status, fetchPrescriptionStatus]);

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

    const showReminderPanel =
        consultation.status === 'completed' &&
        (consultation.prescriptionText || consultation.prescriptionUrl || consultation.notes);

    return (
        <div
            ref={cardRef}
            id={`consultation-${consultation.id}`}
            className={`bg-white border rounded-3xl p-6 sm:p-7 flex flex-col gap-5 transition-all shadow-xs ${
                highlighted ? 'border-[#e13b68] ring-2 ring-[#e13b68]/20 shadow-md' : 'border-[#f5e4ec]'
            }`}
        >
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#fdf0f4] pb-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-base font-black text-[#e13b68] shrink-0">
                        {(doctor.fullName ? doctor.fullName.replace('Dr. ', '').charAt(0) : 'D')}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-base text-[#1c1218]">
                                {doctor.fullName || 'Assigned Clinical Doctor'}
                            </h3>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        {doctor.specialization && (
                            <p className="text-xs font-bold text-[#e13b68] mt-0.5">
                                {doctor.specialization}
                            </p>
                        )}
                        {clinic.clinicName && (
                            <p className="text-xs font-semibold text-[#7d6974] flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-[#7d6974]" />
                                <span>{clinic.clinicName}{clinic.city ? `, ${clinic.city}` : ''}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                    <span className={`px-3 py-1 text-xs font-black rounded-full border whitespace-nowrap ${badge.bg}`}>
                        {badge.label}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#7d6974]">
                <Clock className="w-3.5 h-3.5 text-[#e13b68]" />
                <span>{scheduledAt}</span>
            </div>

            {/* In-progress: rejoin call */}
            {consultation.status === 'in_progress' && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900">Live Teleconsultation Active</span>
                        <button
                            type="button"
                            disabled={joining}
                            onClick={handleRejoin}
                            className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                            <Video className="w-3.5 h-3.5" />
                            <span>{joining ? 'Connecting...' : 'Rejoin Video Consultation'}</span>
                        </button>
                    </div>
                    {joinError && <p className="text-xs text-rose-600 font-bold">{joinError}</p>}
                </div>
            )}

            {/* Completed: prescription + rating + AI summary + reminders */}
            {consultation.status === 'completed' && (
                <div className="flex flex-col gap-4">
                    {/* Prescription download + blockchain badge */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        {prescLoading && (
                            <p className="text-xs text-[#7d6974] animate-pulse">Loading prescription data...</p>
                        )}

                        {prescInfo?.prescriptionUrl ? (
                            <a
                                href={prescInfo.prescriptionUrl}
                                download={`Prescription_${consultation.id}.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black bg-[#fdf5f7] border border-[#f8c8d8] text-[#e13b68] hover:bg-[#ffe6ee] rounded-full transition shadow-2xs"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Prescription (PDF)</span>
                            </a>
                        ) : !prescLoading && (
                            <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#faf5f8] border border-[#eedde6] text-[#a895a0] rounded-full cursor-not-allowed"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Prescription Generating...</span>
                            </button>
                        )}

                        {/* Blockchain badge */}
                        {prescInfo?.blockchainStatus === 'verified' && (
                            <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 text-[11px] font-bold text-teal-800">
                                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span>Blockchain Verified</span>
                                {prescInfo.explorerUrl && (
                                    <a
                                        href={prescInfo.explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal-700 underline flex items-center gap-0.5 ml-1"
                                    >
                                        <span>Tx</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Verify authenticity */}
                        {prescInfo && (
                            <Link
                                to={`/verify/${consultation.id}`}
                                className="text-xs font-bold text-[#e13b68] hover:underline flex items-center gap-1"
                            >
                                <Search className="w-3 h-3" />
                                <span>Verify Authenticity</span>
                            </Link>
                        )}
                    </div>

                    {/* AI Summary */}
                    <AiSummaryCard
                        consultationId={consultation.id}
                        existingSummary={consultation.aiSummary || consultation.ai_summary}
                    />

                    {/* Medication Reminders panel */}
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
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Review submitted successfully. Thank you for your feedback!</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Sub-tab toggle ─────────────────────────────────────────────────────────────
const TABS = [
    { id: 'list', label: 'My Consultations' },
    { id: 'timeline', label: 'Symptom Timeline' },
];

export default function PatientConsultations() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('list');
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [highlightedId, setHighlightedId] = useState(null);

    const cardRefs = useRef({});

    const fetchConsultations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await consultationService.getMyConsultations(page, 10);
            setData(result);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load consultation history');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);

    const handleSelectTimelineEntry = (consultationId) => {
        setActiveTab('list');
        setHighlightedId(consultationId);
        setTimeout(() => {
            const el = cardRefs.current[consultationId];
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const consultations = data?.consultations || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / 10) || 1;

    return (
        <div className="w-full flex flex-col gap-6 text-left relative max-w-5xl mx-auto pb-16 animate-fade-in-up">
            {/* Header Welcome Bar */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#1c1218] font-heading tracking-tight">
                        My Consultations
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold text-[#7d6974] mt-1">
                        View your appointment history, digital prescriptions, and symptom progress timeline.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-[#fdf0f4] p-1.5 rounded-2xl border border-[#f5e4ec]">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-white text-[#e13b68] shadow-xs font-black'
                                    : 'text-[#7d6974] hover:text-[#2d2329]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
                    {error}
                </div>
            )}

            {/* Content Tabs */}
            {activeTab === 'timeline' ? (
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 sm:p-8 shadow-xs">
                    <SymptomTimeline onSelectEntry={handleSelectTimelineEntry} />
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {loading ? (
                        <div className="p-16 text-center text-xs font-bold text-[#7d6974] bg-white border border-[#f5e4ec] rounded-3xl animate-pulse">
                            Loading your consultation records...
                        </div>
                    ) : consultations.length === 0 ? (
                        <div className="bg-white border border-[#f5e4ec] rounded-3xl p-12 text-center flex flex-col items-center gap-4 shadow-xs">
                            <div className="w-16 h-16 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68]">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col gap-1 max-w-sm">
                                <h3 className="font-black text-lg text-[#1c1218]">No Consultations Yet</h3>
                                <p className="text-xs font-semibold text-[#7d6974]">
                                    Start an AI Clinical Triage to be routed to verified doctor care.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/patient/ai-triage')}
                                className="px-6 py-3 rounded-full bg-[#e13b68] text-white font-black text-xs hover:bg-[#c92a55] transition shadow-md flex items-center gap-2 cursor-pointer"
                            >
                                <span>Start Clinical Triage</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        consultations.map((c) => (
                            <ConsultationCard
                                key={c.id}
                                consultation={c}
                                highlighted={highlightedId === c.id}
                                cardRef={(el) => {
                                    if (el) cardRefs.current[c.id] = el;
                                }}
                            />
                        ))
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-4">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="px-4 py-2 text-xs font-bold border border-[#f5e4ec] rounded-full bg-white disabled:opacity-40 hover:bg-[#fff0f4] transition"
                            >
                                Previous
                            </button>
                            <span className="text-xs font-bold text-[#7d6974]">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-4 py-2 text-xs font-bold border border-[#f5e4ec] rounded-full bg-white disabled:opacity-40 hover:bg-[#fff0f4] transition"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
