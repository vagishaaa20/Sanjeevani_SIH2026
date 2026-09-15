import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import { 
    Calendar, 
    Clock, 
    CheckCircle2, 
    User, 
    Building2, 
    RefreshCw, 
    AlertCircle, 
    Check, 
    X,
    FileText,
    CalendarCheck,
    Stethoscope,
    Loader2,
    Activity,
    Pill
} from 'lucide-react';
import Modal from '../common/Modal';

export default function DoctorClinicAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const { socket } = useContext(SocketContext);

    // Completion modal state
    const [completingAppt, setCompletingAppt] = useState(null);
    const [finalDiagnosis, setFinalDiagnosis] = useState('');
    const [prescriptionText, setPrescriptionText] = useState('');
    const [notes, setNotes] = useState('');
    const [severityScore, setSeverityScore] = useState(2);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const fetchAppointments = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await api.get('/appointments/doctor');
            setAppointments(res.data.appointments || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch doctor appointments:', err);
            setError('Could not load in-person clinic appointments.');
        } finally {
            setLoading(false);
            if (isManual) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        const interval = setInterval(() => fetchAppointments(false), 20000);
        return () => clearInterval(interval);
    }, []);

    // Real-time socket listener
    useEffect(() => {
        if (!socket) return;
        const handleNewAppointment = (appt) => {
            setAppointments((prev) => [appt, ...prev.filter(a => a.id !== appt.id)]);
        };
        const handleStatusChange = (appt) => {
            setAppointments((prev) => prev.map(a => a.id === appt.id ? { ...a, status: appt.status } : a));
        };

        socket.on('appointment:new', handleNewAppointment);
        socket.on('appointment:status_change', handleStatusChange);

        return () => {
            socket.off('appointment:new', handleNewAppointment);
            socket.off('appointment:status_change', handleStatusChange);
        };
    }, [socket]);

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        setUpdatingId(appointmentId);
        try {
            await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
            setAppointments((prev) =>
                prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
            );
        } catch (err) {
            console.error('Failed to update appointment status:', err);
            alert('Failed to update status. Please try again.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleOpenCompleteModal = (appt) => {
        setCompletingAppt(appt);
        setFinalDiagnosis('');
        setPrescriptionText('');
        setNotes(appt.symptoms ? `Chief complaint: ${appt.symptoms}` : '');
        setSeverityScore(2);
        setSubmitError('');
    };

    const handleCompleteExamination = async (e) => {
        e.preventDefault();
        if (!completingAppt) return;
        setSubmitError('');

        if (!finalDiagnosis.trim() && !notes.trim()) {
            setSubmitError('A final diagnosis or clinical notes are required to complete the examination.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post(`/appointments/${completingAppt.id}/complete`, {
                finalDiagnosis: finalDiagnosis.trim(),
                prescriptionText: prescriptionText.trim(),
                notes: notes.trim(),
                severityScore
            });

            setAppointments((prev) =>
                prev.map((a) => (a.id === completingAppt.id ? { ...a, status: 'completed' } : a))
            );

            setCompletingAppt(null);
        } catch (err) {
            console.error('Failed to complete appointment:', err);
            setSubmitError(err.response?.data?.error || 'Failed to complete examination. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter today's vs upcoming
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div
            className="rounded-3xl flex flex-col overflow-hidden shadow-xs text-left"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
            {/* Header */}
            <div
                className="p-5 md:p-6 flex items-center justify-between gap-4 flex-wrap"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-bg)' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
                        style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)' }}
                    >
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base md:text-lg font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                                In-Person Clinic Appointments
                            </h3>
                            <span
                                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)' }}
                            >
                                {appointments.length} Scheduled
                            </span>
                        </div>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            Scheduled physical patient visits at your clinic chamber
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => fetchAppointments(true)}
                        disabled={refreshing}
                        className="p-2 rounded-xl transition cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Refresh Appointments"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--accent)' }} />
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="p-5 md:p-6 flex flex-col gap-4 max-h-[600px] overflow-y-auto">
                {loading && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
                        <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                            Loading scheduled clinic appointments…
                        </p>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!loading && !error && appointments.length === 0 && (
                    <div className="text-center py-12 px-4 flex flex-col gap-3 items-center justify-center">
                        <div
                            className="w-16 h-16 rounded-3xl flex items-center justify-center"
                            style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)' }}
                        >
                            <CalendarCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                No Clinic Appointments Booked
                            </h4>
                            <p className="text-xs font-medium mt-0.5 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                                When patients choose an in-person visit with your practice, their scheduled timings and tokens will appear here.
                            </p>
                        </div>
                    </div>
                )}

                {appointments.map((appt) => {
                    const patient = appt.patient || {};
                    const patientName = patient.fullName || 'Registered Patient';
                    const initials = patientName.charAt(0).toUpperCase();
                    const apptDateObj = new Date(appt.appointmentDate);
                    const isToday = apptDateObj.toISOString().split('T')[0] === todayStr;

                    return (
                        <div
                            key={appt.id}
                            className="rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-2xs hover:shadow-xs transition duration-150"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0"
                                        style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)', border: '1px solid var(--border)' }}
                                    >
                                        {initials}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {patientName}
                                            </h4>
                                            <span
                                                className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase"
                                                style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)' }}
                                            >
                                                OPD Token #{appt.tokenNumber || 1}
                                            </span>
                                            {patient.gender && (
                                                <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                    · {patient.gender} {patient.age ? `, ${patient.age} yrs` : ''}
                                                </span>
                                            )}
                                            {patient.bloodGroup && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                                    Blood: {patient.bloodGroup}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            <span className="flex items-center gap-1 font-bold text-[#8e1d41]">
                                                <Calendar className="w-3.5 h-3.5 text-[#e13b68]" />
                                                {apptDateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                {isToday && ' (Today)'}
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-gray-700">
                                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                {appt.timeSlot || 'OPD Slot'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <span
                                        className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border"
                                        style={
                                            appt.status === 'completed'
                                                ? { background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)', borderColor: 'var(--pastel-mint-text)' }
                                                : appt.status === 'checked_in'
                                                ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--notif-unread-border)' }
                                                : appt.status === 'cancelled'
                                                ? { background: 'var(--pastel-pink-bg)', color: 'var(--accent)', borderColor: 'var(--accent)' }
                                                : { background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)', borderColor: 'var(--pastel-peach-text)' }
                                        }
                                    >
                                        {appt.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Symptoms / Chief Complaint */}
                            {appt.symptoms && (
                                <div
                                    className="px-3.5 py-2 rounded-xl text-xs flex flex-col gap-0.5"
                                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                                >
                                    <span className="font-bold text-[10px] uppercase text-[#7d6974]">Chief Complaint / Symptoms:</span>
                                    <span className="text-gray-800 font-medium">{appt.symptoms}</span>
                                </div>
                            )}

                            {/* Status Actions */}
                            <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                {appt.status === 'scheduled' && (
                                    <button
                                        onClick={() => handleStatusUpdate(appt.id, 'checked_in')}
                                        disabled={updatingId === appt.id}
                                        className="px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300"
                                    >
                                        <Check className="w-3 h-3" />
                                        <span>Mark Patient Arrived</span>
                                    </button>
                                )}

                                {(appt.status === 'scheduled' || appt.status === 'checked_in') && (
                                    <button
                                        onClick={() => handleOpenCompleteModal(appt)}
                                        className="px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-white shadow-xs hover:opacity-90"
                                        style={{ background: 'var(--accent)' }}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Complete Examination</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* In-Person Clinic Examination Completion Modal */}
            <Modal
                isOpen={!!completingAppt}
                onClose={() => setCompletingAppt(null)}
                title="Complete Clinic Examination & Clinical Orders"
                size="lg"
            >
                {completingAppt && (
                    <form onSubmit={handleCompleteExamination} className="flex flex-col gap-4 text-left">
                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-900">
                                    Patient: {completingAppt.patient?.fullName || 'Patient'}
                                </span>
                                <span className="font-black text-amber-800">
                                    OPD Token #{completingAppt.tokenNumber || 1}
                                </span>
                            </div>
                            {completingAppt.symptoms && (
                                <p className="text-[11px] text-amber-800 mt-0.5">
                                    <span className="font-bold">Reported Symptoms:</span> {completingAppt.symptoms}
                                </p>
                            )}
                        </div>

                        {submitError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        {/* Final Diagnosis */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1">
                                <Stethoscope className="w-3.5 h-3.5 text-[#e13b68]" />
                                <span>Final Diagnosis / Clinical Impression <span className="text-rose-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                required
                                value={finalDiagnosis}
                                onChange={(e) => setFinalDiagnosis(e.target.value)}
                                placeholder="e.g., Acute Viral Bronchitis, Gastroenteritis, Type 2 Diabetes"
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        {/* Prescription Text & Medication Extraction */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1">
                                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Prescription &amp; Medication Orders</span>
                                </label>
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Auto-syncs Medication Reminders
                                </span>
                            </div>
                            <textarea
                                rows={3}
                                value={prescriptionText}
                                onChange={(e) => setPrescriptionText(e.target.value)}
                                placeholder="e.g., Tab Paracetamol 650mg TDS x 3 days&#10;Cap Amoxicillin 500mg TDS x 5 days"
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <p className="text-[10px] text-gray-500">
                                Prescribed medicines will be automatically extracted into the patient's WhatsApp &amp; in-app medication schedule.
                            </p>
                        </div>

                        {/* Outbreak Severity Assessment */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Outbreak Severity Assessment</span>
                                </label>
                                <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Epidemic Heatmap Feed
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { score: 1, label: '1 - Low', desc: 'Mild / Routine symptom' },
                                    { score: 2, label: '2 - Moderate', desc: 'Cluster candidate' },
                                    { score: 3, label: '3 - High', desc: 'High contagion risk' }
                                ].map(({ score, label, desc }) => (
                                    <button
                                        key={score}
                                        type="button"
                                        onClick={() => setSeverityScore(score)}
                                        className={`p-2.5 rounded-xl text-xs font-bold text-center border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                            severityScore === score
                                                ? score === 1 
                                                    ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                                                    : score === 2
                                                    ? 'bg-amber-100 border-amber-500 text-amber-900'
                                                    : 'bg-rose-100 border-rose-500 text-rose-900'
                                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                                        }`}
                                    >
                                        <span>{label}</span>
                                        <span className="text-[10px] font-medium opacity-80">{desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clinical Notes */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-sky-600" />
                                <span>Clinical Notes &amp; Advice</span>
                            </label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g., Physical examination normal, throat congested. Rest and hydrate."
                                className="w-full px-3.5 py-2 rounded-xl text-xs border font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                            <button
                                type="button"
                                onClick={() => setCompletingAppt(null)}
                                className="px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!finalDiagnosis.trim() && !notes.trim())}
                                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                style={{ background: 'var(--accent)' }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Recording Examination...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Finalize &amp; Complete Examination</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
