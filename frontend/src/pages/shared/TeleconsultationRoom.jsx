import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import useWebRTC from '../../hooks/useWebRTC';
import { NotificationContext } from '../../context/NotificationContext';
import { generateDynamicFutureSlots } from '../../utils/timeSlots';
import { 
    Phone, 
    Calendar, 
    Clock, 
    Video, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    Send,
    User
} from 'lucide-react';

export default function TeleconsultationRoom() {
    const { id: consultationId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addNotification } = useContext(NotificationContext);

    const [chatInput, setChatInput] = useState('');
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    const isDoctor = user.role === 'doctor';

    const handleCallError = (error) => {
        if (error.isRemoteCompletion) {
            addNotification(error.message, 'info', 7000);
        } else if (error.isRemoteDrop) {
            addNotification(error.message, 'warning', 7000);
        } else {
            addNotification(error.message, 'error', 7000);
        }
        if (isDoctor) navigate('/doctor/dashboard');
        else navigate('/patient/dashboard');
    };

    const {
        remoteUsers,
        quality,
        chat,
        localStream,
        remoteStream,
        mediaMode,
        sendMessage,
        switchToAudioMode,
        switchToVideoMode
    } = useWebRTC(consultationId, user, handleCallError);

    const [showQualityBanner, setShowQualityBanner] = useState(false);

    useEffect(() => {
        if (quality === 'poor' && mediaMode === 'video') {
            setShowQualityBanner(true);
        } else if (mediaMode === 'audio-only') {
            setShowQualityBanner(false);
        }
    }, [quality, mediaMode]);

    // Refs for binding the streams to <video> tags
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Whenever streams update, attach them to the video players
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const sendChat = (e) => {
        e.preventDefault();
        sendMessage(chatInput);
        setChatInput('');
    };

    // Add new state variables for modal
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [finalDiagnosis, setFinalDiagnosis] = useState('');
    const [prescriptionText, setPrescriptionText] = useState('');
    const [severityScore, setSeverityScore] = useState(2);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        setTimeout(() => setSavingNotes(false), 500); // Visual indicator only
    };

    const handleCompleteCallClick = () => {
        if (isDoctor) {
            setShowCompletionModal(true);
        } else {
            completeAsPatient();
        }
    };

    const completeAsPatient = async () => {
        try {
            await api.post(`/consultations/${consultationId}/end`);
            addNotification('Call ended successfully.', 'success', 5000);
            navigate('/patient/dashboard');
        } catch (e) {
            console.error('Failed to end', e);
            addNotification('Failed to end call. Please try again.', 'error');
        }
    };

    const submitDoctorCompletion = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!notes.trim() && !finalDiagnosis.trim()) {
            setSubmitError('Clinical notes or a diagnosis are required.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post(`/consultations/${consultationId}/complete`, {
                notes,
                finalDiagnosis,
                prescriptionText,
                severityScore
            });
            addNotification('Consultation marked complete successfully.', 'success', 5000);
            navigate('/doctor/dashboard');
        } catch (err) {
            console.error('Completion error', err);
            setSubmitError(err.response?.data?.error || 'Failed to submit consultation data.');
            setIsSubmitting(false);
        }
    };

    // Reschedule modal state
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleSlot, setRescheduleSlot] = useState('In 15 minutes');
    const [customRescheduleSlot, setCustomRescheduleSlot] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('Network connectivity issue');
    const [isRescheduling, setIsRescheduling] = useState(false);

    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        setIsRescheduling(true);
        try {
            const finalSlot = customRescheduleSlot.trim() || rescheduleSlot;
            await api.post(`/consultations/${consultationId}/reschedule`, {
                newTimeSlot: finalSlot,
                reason: rescheduleReason
            });
            addNotification(`Consultation rescheduled to: ${finalSlot}`, 'success', 6000);
            if (isDoctor) navigate('/doctor/dashboard');
            else navigate('/patient/dashboard');
        } catch (err) {
            console.error('Reschedule error', err);
            addNotification(err.response?.data?.error || 'Failed to reschedule consultation.', 'error');
        } finally {
            setIsRescheduling(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 p-4 text-left">
            {/* Main Video View */}
            <div className="flex-1 flex flex-col bg-stone-900 rounded-2xl overflow-hidden border-2 border-stone-800 shadow-lg relative">

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 w-full p-4 flex flex-wrap justify-between items-center z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                            quality === 'good' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}>
                            Signal: {quality.toUpperCase()}
                        </span>
                        {remoteUsers === 0 && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cream-card/90 text-stone-900 uppercase">
                                Waiting for {isDoctor ? 'Patient' : 'Doctor'}...
                            </span>
                        )}
                    </div>

                    {/* Quick Session Control Bar */}
                    <div className="flex items-center gap-2">
                        {/* Audio / Video Switcher */}
                        <button
                            onClick={mediaMode === 'video' ? switchToAudioMode : switchToVideoMode}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 border border-white/20 bg-black/40 hover:bg-black/60 cursor-pointer"
                            title="Switch between video and low-bandwidth voice mode"
                        >
                            {mediaMode === 'video' ? (
                                <>
                                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Voice Call Only</span>
                                </>
                            ) : (
                                <>
                                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Turn on Video</span>
                                </>
                            )}
                        </button>

                        {/* Reschedule Button - Doctor Only */}
                        {isDoctor && (
                            <button
                                onClick={() => setShowRescheduleModal(true)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 border border-white/20 bg-black/40 hover:bg-black/60 cursor-pointer"
                                title="Reschedule consultation slot"
                            >
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                <span>Reschedule</span>
                            </button>
                        )}

                        {/* End Call */}
                        <button
                            onClick={handleCompleteCallClick}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                        >
                            {isDoctor ? 'FINALIZE & CLOSE' : 'END CALL'}
                        </button>
                    </div>
                </div>

                {/* Participant Unreachable / Delay Helper */}
                {remoteUsers === 0 && (
                    <div className="absolute top-16 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 z-30 flex flex-col sm:flex-row items-center justify-between text-white text-xs gap-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                                {isDoctor 
                                    ? 'Patient not connected yet. If there are network issues, switch to voice call or reschedule.' 
                                    : 'Waiting for doctor to connect. You can switch to low-bandwidth voice mode if connection is slow.'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={switchToAudioMode}
                                className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold hover:bg-sky-500/30 cursor-pointer"
                            >
                                Voice Mode
                            </button>
                            {isDoctor && (
                                <button
                                    onClick={() => setShowRescheduleModal(true)}
                                    className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold hover:bg-amber-500/30 cursor-pointer"
                                >
                                    Reschedule
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Quality Warning Banner */}
                {showQualityBanner && mediaMode === 'video' && (
                    <div className="absolute top-28 left-4 right-4 bg-red-600/90 border border-red-400 rounded-xl p-3 z-30 flex items-center justify-between text-white shadow-xl">
                        <div>
                            <p className="font-bold uppercase text-xs">Poor Connection Detected</p>
                            <p className="text-[11px] opacity-90">Switch to low-bandwidth voice mode to stabilize.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    switchToAudioMode();
                                    setShowQualityBanner(false);
                                }}
                                className="bg-cream-card text-red-700 font-bold px-3 py-1 rounded text-xs transition cursor-pointer"
                            >
                                Switch to Audio
                            </button>
                            <button
                                onClick={() => setShowQualityBanner(false)}
                                className="hover:bg-red-700 px-2 py-1 rounded font-bold text-xs cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Persistent Audio Mode View */}
                {mediaMode === 'audio-only' && (
                    <div className="absolute inset-0 bg-stone-900 z-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-sky-950 flex items-center justify-center animate-pulse border-4 border-sky-500">
                            <Phone className="w-10 h-10 text-sky-400" />
                        </div>
                        <h2 className="text-white font-bold text-xl uppercase tracking-widest">Low-Bandwidth Voice Call</h2>
                        <p className="text-xs text-stone-400 max-w-xs text-center">
                            Audio stream active. Video is paused to prevent lag on slower network connections.
                        </p>
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={switchToVideoMode}
                                className="bg-cream-card text-stone-900 font-bold px-5 py-2.5 rounded-xl shadow-lg transition hover:bg-stone-100 text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Video className="w-4 h-4 text-emerald-600" />
                                <span>Switch Back to Video</span>
                            </button>
                            {isDoctor && (
                                <button
                                    onClick={() => setShowRescheduleModal(true)}
                                    className="bg-stone-800 text-stone-200 border border-stone-700 font-bold px-5 py-2.5 rounded-xl transition hover:bg-stone-700 text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Calendar className="w-4 h-4 text-amber-400" />
                                    <span>Reschedule</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Remote Video Base */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Picture in Picture Local Video */}
                {mediaMode === 'video' && (
                    <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] border-2 border-stone-700 rounded-xl overflow-hidden shadow-lg bg-black z-20">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform -scale-x-100"
                        />
                    </div>
                )}
            </div>

            {/* Sidebar View (Chat + Notes) */}
            <div className="w-full md:w-80 flex flex-col gap-4">

                {/* Doctor Note Taking (Hidden from patients) */}
                {isDoctor && (
                    <div className="flex-1 flex flex-col bg-amber-50 border-2 border-ink-black rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-ink-black uppercase text-sm tracking-wider">Clinical Notes</h3>
                            <span className="text-[10px] uppercase font-bold text-ink-muted">
                                {savingNotes ? 'Saving...' : 'Autosaved'}
                            </span>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                handleSaveNotes();
                            }}
                            className="flex-1 w-full bg-transparent resize-none outline-none border-b border-amber-200/50 text-sm font-medium text-ink-black leading-relaxed"
                            placeholder="Type observation notes here..."
                        />
                    </div>
                )}

                {/* Socket.io Chat Box */}
                <div className="flex-1 flex flex-col bg-cream-card border-2 border-ink-black rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-ink-black text-white p-3 border-b-2 border-ink-black">
                        <h3 className="font-bold text-sm uppercase tracking-wider">Messages</h3>
                    </div>

                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto bg-stone-50 text-sm">
                        {chat.length === 0 && (
                            <p className="text-center text-ink-muted font-bold mt-10">No messages yet.</p>
                        )}
                        {chat.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.senderName === (user.profile?.fullName || 'User') ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] font-bold text-ink-muted uppercase">{m.senderName}</span>
                                <div className={`px-3 py-1.5 rounded-lg font-medium border-2 mt-0.5 ${m.senderName === (user.profile?.fullName || 'User')
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 rounded-tr-none'
                                    : 'bg-cream-card border-ink-black text-ink-black rounded-tl-none'
                                    }`}>
                                    {m.message}
                                </div>
                                <span className="text-[9px] text-ink-muted mt-0.5">{m.time}</span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={sendChat} className="p-2 border-t-2 border-ink-black bg-cream-card flex gap-2">
                        <input
                            type="text"
                            className="flex-1 w-full p-2 bg-stone-100 rounded border border-stone-300 outline-none focus:border-emerald-500 font-medium text-sm"
                            placeholder="Message..."
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                        />
                        <button type="submit" disabled={!chatInput.trim()} className="px-3 bg-ink-black text-white rounded font-bold hover:bg-ink-charcoal disabled:opacity-50">
                            ↑
                        </button>
                    </form>
                </div>
            </div>

            {/* Doctor Completion Modal */}
            {isDoctor && showCompletionModal && (
                <div className="fixed inset-0 bg-ink-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-cream-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border-2 border-ink-black animate-slide-up relative">
                        <div className="p-6 border-b-2 border-ink-black bg-stone-50 rounded-t-3xl flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-ink-black uppercase tracking-wider">Complete Consultation</h2>
                                <p className="text-xs font-bold text-ink-muted">Finalize clinical documentation before closing</p>
                            </div>
                            <button
                                onClick={() => setShowCompletionModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-ink-black hover:bg-red-50 text-ink-black font-black"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitDoctorCompletion} className="p-6 flex flex-col gap-6">
                            {submitError && (
                                <div className="p-3 bg-red-100 border-2 border-red-300 text-red-900 text-xs font-bold rounded-xl animate-pulse">
                                    {submitError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-black uppercase text-ink-black mb-2">Final Diagnosis / Impressions <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={finalDiagnosis}
                                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                                    className="w-full bg-cream-card border-2 border-ink-black rounded-xl p-3 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition font-medium"
                                    placeholder="e.g. Upper Respiratory Tract Infection"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black uppercase text-ink-black mb-2">Prescription & Orders</label>
                                <textarea
                                    value={prescriptionText}
                                    onChange={(e) => setPrescriptionText(e.target.value)}
                                    rows={4}
                                    className="w-full bg-cream-card border-2 border-ink-black rounded-xl p-3 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition font-medium resize-none"
                                    placeholder="e.g. Paracetamol 500mg SOS"
                                />
                                <p className="text-[10px] uppercase font-bold text-ink-muted mt-1">This will be processed by the Medication Reminders engine for the patient.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-black uppercase text-ink-black mb-2">Outbreak Severity Assessment</label>
                                <div className="flex gap-4">
                                    {[1, 2, 3].map(score => (
                                        <button
                                            key={score}
                                            type="button"
                                            onClick={() => setSeverityScore(score)}
                                            className={`flex-1 py-3 rounded-xl border-2 font-black transition-all ${severityScore === score
                                                ? score === 1 ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : score === 2 ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-red-100 border-red-500 text-red-900'
                                                : 'bg-stone-50 border-ink-black/20 text-ink-muted hover:border-ink-black'
                                                }`}
                                        >
                                            {score === 1 && '1 - LOW'}
                                            {score === 2 && '2 - MODERATE'}
                                            {score === 3 && '3 - HIGH'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t-2 border-ink-black/10 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCompletionModal(false)}
                                    className="px-6 py-3 rounded-xl font-black text-ink-muted hover:bg-stone-100 transition"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (!finalDiagnosis.trim() && !notes.trim())}
                                    className="px-6 py-3 rounded-xl bg-ink-black text-white font-black hover:bg-ink-charcoal transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                                >
                                    {isSubmitting ? 'SAVING...' : 'FINALIZE & CLOSE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reschedule Consultation Modal - Doctor Only */}
            {isDoctor && showRescheduleModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-cream-card rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border-2 border-stone-800 animate-slide-up relative text-left">
                        <div className="p-5 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-amber-500" />
                                    <span>Reschedule Consultation</span>
                                </h2>
                                <p className="text-xs font-semibold text-stone-500 mt-0.5">
                                    Propose a new timing if there are network issues or unreachability
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRescheduleModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-300 hover:bg-stone-100 text-stone-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleRescheduleSubmit} className="p-5 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                                    Select New Time Slot:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {generateDynamicFutureSlots().map((slotObj) => {
                                        const slot = slotObj.label;
                                        const isSelected = rescheduleSlot === slot && !customRescheduleSlot;
                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => {
                                                    setRescheduleSlot(slot);
                                                    setCustomRescheduleSlot('');
                                                }}
                                                className={`p-2.5 rounded-xl text-xs font-bold text-left border transition cursor-pointer flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-amber-50 border-amber-400 text-amber-900'
                                                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                                                }`}
                                            >
                                                <span className="truncate">{slot}</span>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                    Or Custom Time / Specific Note:
                                </label>
                                <input
                                    type="text"
                                    value={customRescheduleSlot}
                                    onChange={(e) => setCustomRescheduleSlot(e.target.value)}
                                    placeholder="e.g., Today at 07:15 PM sharp"
                                    className="w-full px-3 py-2 rounded-xl text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                    Reason for Rescheduling:
                                </label>
                                <select
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 font-medium bg-cream-card"
                                >
                                    <option value="Network connectivity issue">Network connectivity / poor signal</option>
                                    <option value="Patient unreachable / did not connect">Patient unreachable / did not answer</option>
                                    <option value="Doctor emergency delay">Doctor clinical emergency delay</option>
                                    <option value="Patient requested later slot">Patient requested later timing</option>
                                </select>
                            </div>

                            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowRescheduleModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRescheduling}
                                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-black text-xs transition shadow-md disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {isRescheduling ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Confirm Reschedule</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
