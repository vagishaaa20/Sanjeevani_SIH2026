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
    ExternalLink,
    MapPin
} from 'lucide-react';
import consultationService from '../../services/consultationService';
import AiSummaryCard from '../../components/patient/AiSummaryCard';
import SymptomTimeline from '../../components/patient/SymptomTimeline';
import MedicationReminderPanel from '../../components/patient/MedicationReminderPanel';

// ── Status badge config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    queued: { label: 'Queued', bgToken: 'var(--pastel-peach-bg)', textToken: 'var(--pastel-peach-text)' },
    assigned: { label: 'Assigned', bgToken: 'var(--pastel-sky-bg)', textToken: 'var(--pastel-sky-text)' },
    in_progress: { label: 'In Progress', bgToken: 'var(--pastel-mint-bg)', textToken: 'var(--pastel-mint-text)', pulse: true },
    completed: { label: 'Completed', bgToken: 'var(--pastel-lavender-bg)', textToken: 'var(--pastel-lavender-text)' },
    cancelled: { label: 'Cancelled', bgToken: 'var(--bg-surface)', textToken: 'var(--text-secondary)' },
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
        <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Rate Your Consultation Experience
                </p>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
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
                            className={`w-6 h-6 transition-colors ${star <= (hovered || selected)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-400 fill-none'
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
                className="w-full text-xs rounded-xl p-3 resize-none focus:outline-none focus:ring-2 transition"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />

            {error && <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{error}</p>}

            <button
                type="button"
                disabled={!selected || submitting}
                onClick={handleSubmit}
                className="self-start px-5 py-2 text-xs font-black rounded-full disabled:opacity-40 transition-all shadow-xs cursor-pointer text-white"
                style={{ background: 'var(--accent)' }}
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
            navigate(`/patient/consultation/${consultation.id}/room`);
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
            className="rounded-3xl p-6 sm:p-7 flex flex-col gap-5 transition-all shadow-xs"
            style={{
                background: 'var(--card-bg)',
                border: highlighted ? '2px solid var(--accent)' : '1px solid var(--border)'
            }}
        >
            {/* Header row */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
                <div className="flex items-center gap-3.5">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0"
                        style={{ background: 'var(--accent-light)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                    >
                        {(doctor.fullName ? doctor.fullName.replace('Dr. ', '').charAt(0) : 'D')}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                                {doctor.fullName || 'Assigned Clinical Doctor'}
                            </h3>
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        {doctor.specialization && (
                            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--accent)' }}>
                                {doctor.specialization}
                            </p>
                        )}
                        {clinic.clinicName && (
                            <p className="text-xs font-semibold flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                <Building2 className="w-3 h-3" />
                                <span>{clinic.clinicName}{clinic.city ? `, ${clinic.city}` : ''}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                    <span
                        className={`px-3 py-1 text-xs font-black rounded-full border whitespace-nowrap ${badge.pulse ? 'animate-pulse' : ''}`}
                        style={{ background: badge.bgToken, color: badge.textToken, borderColor: badge.textToken }}
                    >
                        {badge.label}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span>{scheduledAt}</span>
            </div>

            {/* In-progress: rejoin call */}
            {consultation.status === 'in_progress' && (
                <div
                    className="p-4 rounded-2xl flex flex-col gap-2"
                    style={{ background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-text)' }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: 'var(--pastel-mint-text)' }}>Live Teleconsultation Active</span>
                        <button
                            type="button"
                            disabled={joining}
                            onClick={handleRejoin}
                            className="px-4 py-2 text-xs font-black rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer text-white"
                            style={{ background: 'var(--pastel-mint-text)' }}
                        >
                            <Video className="w-3.5 h-3.5" />
                            <span>{joining ? 'Connecting...' : 'Rejoin Video Consultation'}</span>
                        </button>
                    </div>
                    {joinError && <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{joinError}</p>}
                </div>
            )}

            {/* Completed: prescription + rating + AI summary + reminders */}
            {consultation.status === 'completed' && (
                <div className="flex flex-col gap-4">
                    {/* Prescription download + blockchain badge */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        {prescLoading && (
                            <p className="text-xs animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading prescription data...</p>
                        )}

                        {prescInfo?.prescriptionUrl ? (
                            <a
                                href={prescInfo.prescriptionUrl}
                                download={`Prescription_${consultation.id}.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-full transition shadow-2xs"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Prescription (PDF)</span>
                            </a>
                        ) : !prescLoading && (
                            <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full cursor-not-allowed opacity-50"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Prescription Generating...</span>
                            </button>
                        )}

                        {/* Blockchain badge */}
                        {prescInfo?.blockchainStatus === 'verified' && (
                            <div
                                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                                style={{ background: 'var(--pastel-sky-bg)', color: 'var(--pastel-sky-text)', border: '1px solid var(--pastel-sky-text)' }}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Blockchain Verified</span>
                                {prescInfo.explorerUrl && (
                                    <a
                                        href={prescInfo.explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline flex items-center gap-0.5 ml-1"
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
                                className="text-xs font-bold hover:underline flex items-center gap-1"
                                style={{ color: 'var(--accent)' }}
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
                        <div
                            className="p-3 rounded-2xl flex items-center gap-2 text-xs font-bold"
                            style={{ background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-text)', color: 'var(--pastel-mint-text)' }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
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
    { id: 'list', label: 'Teleconsultations' },
    { id: 'clinic', label: 'In-Person Clinic Visits' },
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

    // In-person clinic appointments
    const [clinicAppointments, setClinicAppointments] = useState([]);
    const [clinicLoading, setClinicLoading] = useState(false);

    const cardRefs = useRef({});

    const fetchClinicAppointments = useCallback(async () => {
        setClinicLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
            const res = await fetch(`${API_BASE}/appointments/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setClinicAppointments(json.appointments || []);
            }
        } catch (e) {
            console.error('[fetchClinicAppointments] error:', e);
        } finally {
            setClinicLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClinicAppointments();
    }, [fetchClinicAppointments]);

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
            <div
                className="rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div>
                    <h1 className="text-2xl md:text-3xl font-black font-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        My Consultations
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                        View your appointment history, digital prescriptions, and symptom progress timeline.
                    </p>
                </div>

                <div
                    className="flex items-center gap-2 p-1.5 rounded-2xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === tab.id ? 'shadow-xs font-black' : ''
                                }`}
                            style={
                                activeTab === tab.id
                                    ? { background: 'var(--card-bg)', color: 'var(--accent)' }
                                    : { color: 'var(--text-secondary)' }
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div
                    className="p-4 rounded-2xl text-xs font-semibold"
                    style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                >
                    {error}
                </div>
            )}

            {/* Content Tabs */}
            {activeTab === 'timeline' ? (
                <div
                    className="rounded-3xl p-6 sm:p-8 shadow-xs"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <SymptomTimeline onSelectEntry={handleSelectTimelineEntry} />
                </div>
            ) : activeTab === 'clinic' ? (
                <div className="flex flex-col gap-4">
                    {clinicLoading ? (
                        <div
                            className="p-16 text-center text-xs font-bold rounded-3xl animate-pulse"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Loading your scheduled clinic visits...
                        </div>
                    ) : clinicAppointments.length === 0 ? (
                        <div
                            className="rounded-3xl p-12 text-center flex flex-col items-center gap-4 shadow-xs"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold"
                                style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)' }}
                            >
                                <Building2 className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col gap-1 max-w-sm">
                                <h3 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>No In-Person Clinic Appointments</h3>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                    You have not booked any physical doctor consultations at a clinic chamber.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/patient/ai-triage')}
                                className="px-6 py-3 rounded-full font-black text-xs transition shadow-md flex items-center gap-2 cursor-pointer text-white"
                                style={{ background: 'var(--accent)' }}
                            >
                                <span>Start AI Clinical Triage</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clinicAppointments.map((appt) => {
                                const doc = appt.doctor || {};
                                const apptDate = new Date(appt.appointmentDate);
                                return (
                                    <div
                                        key={appt.id}
                                        className="rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-xs"
                                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0"
                                                        style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)' }}
                                                    >
                                                        {doc.fullName ? doc.fullName.charAt(0) : 'D'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                            Dr. {doc.fullName || 'Verified Physician'}
                                                        </h4>
                                                        <p className="text-xs font-bold text-[#e13b68]">
                                                            {doc.specialization || 'Medical Specialist'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border"
                                                    style={
                                                        appt.status === 'completed'
                                                            ? { background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)', borderColor: 'var(--pastel-mint-text)' }
                                                            : appt.status === 'checked_in'
                                                            ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--notif-unread-border)' }
                                                            : { background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)', borderColor: 'var(--pastel-peach-text)' }
                                                    }
                                                >
                                                    {appt.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <div
                                                className="p-3.5 rounded-2xl text-xs flex flex-col gap-1.5"
                                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                                            >
                                                <div className="flex items-center justify-between font-black text-[#8e1d41]">
                                                    <span>OPD Token #{appt.tokenNumber || 1}</span>
                                                    <span>Fee: ₹{doc.consultationFee || 500}</span>
                                                </div>
                                                <div className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-[#e13b68]" />
                                                    <span>{apptDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {appt.timeSlot || 'OPD Slot'}</span>
                                                </div>
                                                <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-[#e13b68]" />
                                                    <span>{doc.clinicOrHospital || 'Clinic Chamber'} · {[doc.address, doc.city].filter(Boolean).join(', ')}</span>
                                                </div>
                                            </div>

                                            {appt.symptoms && (
                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                    <strong className="font-bold">Reason:</strong> {appt.symptoms}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {loading ? (
                        <div
                            className="p-16 text-center text-xs font-bold rounded-3xl animate-pulse"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Loading your consultation records...
                        </div>
                    ) : consultations.length === 0 ? (
                        <div
                            className="rounded-3xl p-12 text-center flex flex-col items-center gap-4 shadow-xs"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ background: 'var(--accent-light)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                            >
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col gap-1 max-w-sm">
                                <h3 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>No Consultations Yet</h3>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                    Start an AI Clinical Triage to be routed to verified doctor care.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/patient/ai-triage')}
                                className="px-6 py-3 rounded-full font-black text-xs transition shadow-md flex items-center gap-2 cursor-pointer text-white"
                                style={{ background: 'var(--accent)' }}
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
                                className="px-4 py-2 text-xs font-bold rounded-full disabled:opacity-40 transition cursor-pointer"
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                Previous
                            </button>
                            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-4 py-2 text-xs font-bold rounded-full disabled:opacity-40 transition cursor-pointer"
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
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
