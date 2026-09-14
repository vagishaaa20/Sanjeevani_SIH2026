import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import PreCallDocumentSubmit from '../../components/patient/PreCallDocumentSubmit';
import { checkSlotReadiness } from '../../utils/timeSlots';
import { 
    Users, 
    Star, 
    Clock, 
    Video, 
    DollarSign, 
    Award, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    ArrowRight,
    AlertCircle,
    Stethoscope,
    Lock
} from 'lucide-react';

export default function PatientRequests() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [acceptedConsultationId, setAcceptedConsultationId] = useState(null);
    const [selectingDoctorId, setSelectingDoctorId] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [, setTick] = useState(Date.now());

    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

    // Dynamic 1-second interval to update time-gated buttons in real-time
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchMyQueue = async () => {
        try {
            const res = await api.get('/queues/my');
            const newQueue = res.data.queue || [];

            // Fallback recovery: if we missed the socket event, but backend says SERVING
            const servingItem = newQueue.find(q => q.status === 'SERVING' && q.consultation);
            if (servingItem && !acceptedConsultationId) {
                // If scheduledAt is ready, we can attach consultation id
                const readiness = checkSlotReadiness(servingItem.consultation.scheduledAt);
                if (readiness.ready) {
                    setAcceptedConsultationId(servingItem.consultation.id);
                }
            }

            setQueue(newQueue);
        } catch (err) {
            console.error('Failed to fetch my queue', err);
            setError('Could not load your active requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyQueue();
        const interval = setInterval(fetchMyQueue, 8000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleAccepted = (data) => {
            console.log('Doctor accepted directly!', data);
            fetchMyQueue();
        };

        const handleDoctorAccepted = (data) => {
            console.log('New doctor offered consultation!', data);
            fetchMyQueue();
        };

        const handleConfirmed = (data) => {
            console.log('Consultation confirmed!', data);
            fetchMyQueue();
        };

        socket.on('consultation:accepted', handleAccepted);
        socket.on('consultation:doctor_accepted', handleDoctorAccepted);
        socket.on('consultation:confirmed', handleConfirmed);
        socket.on('queue:update', fetchMyQueue);

        return () => {
            socket.off('consultation:accepted', handleAccepted);
            socket.off('consultation:doctor_accepted', handleDoctorAccepted);
            socket.off('consultation:confirmed', handleConfirmed);
            socket.off('queue:update', fetchMyQueue);
        };
    }, [socket]);

    const handleSelectDoctor = async (queueId, doctorId, selectedSlot, slotMetadata) => {
        setSelectingDoctorId(doctorId);
        try {
            const slotPayload = slotMetadata || selectedSlot;
            const res = await api.post(`/queues/${queueId}/select-doctor`, { 
                doctorId, 
                selectedSlot: slotPayload 
            });
            if (res.data.success && res.data.consultation) {
                const readiness = checkSlotReadiness(res.data.consultation.scheduledAt);
                if (readiness.ready) {
                    setAcceptedConsultationId(res.data.consultation.id);
                }
                fetchMyQueue();
            }
        } catch (err) {
            console.error('Select doctor error', err);
            alert(err.response?.data?.error || 'Failed to select doctor. Please try again.');
        } finally {
            setSelectingDoctorId(null);
        }
    };

    const handleCancelQueue = async (queueId) => {
        if (!window.confirm('Are you sure you want to cancel this consultation request?')) return;
        setCancellingId(queueId);
        try {
            await api.post(`/queues/${queueId}/cancel`);
            fetchMyQueue();
        } catch (err) {
            console.error('Cancel queue error', err);
            alert(err.response?.data?.error || 'Failed to cancel request');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 text-left relative min-h-[60vh] pb-16">

            {/* If doctor accepted & serving and time is reached, show pre-call modal if needed */}
            {acceptedConsultationId && (
                <PreCallDocumentSubmit consultationId={acceptedConsultationId} />
            )}

            <div
                className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#e13b68]">
                        Active Teleconsultation Gateway
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        My Active Requests
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Live queue tracker. When matching specialists accept your request, compare their fees &amp; ratings below.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/patient/ai-triage')}
                    className="px-5 py-2.5 rounded-full bg-[#ffe6ee] hover:bg-[#f5c6d6] text-[#8e1d41] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                    <Stethoscope className="w-4 h-4" />
                    <span>Start New Triage</span>
                </button>
            </div>

            <div className="flex flex-col gap-5">
                {loading && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#e13b68] animate-spin" />
                        <p className="font-bold text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Syncing your live queue requests...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!loading && !error && queue.length === 0 && (
                    <div
                        className="rounded-3xl p-10 text-center flex flex-col items-center justify-center shadow-xs"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <div className="w-16 h-16 rounded-3xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center mb-4 font-black">
                            <Stethoscope className="w-8 h-8" />
                        </div>
                        <h3 className="font-black text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
                            No Active Queue Requests
                        </h3>
                        <p className="text-xs sm:text-sm mb-6 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                            You are not currently in any doctor's queue. Run AI Clinical Triage to assess your symptoms and connect with the right care.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={() => navigate('/patient/ai-triage')}
                                className="font-bold px-7 py-3 rounded-full shadow-xs transition-all cursor-pointer text-white"
                                style={{ background: 'var(--accent)' }}
                            >
                                Start AI Clinical Triage
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && queue.length > 0 && queue.map(q => {
                    const acceptedDoctors = Array.isArray(q.acceptedDoctorIds) ? q.acceptedDoctorIds : [];
                    const isBroadcast = !q.doctorId;
                    const consultation = q.consultation;
                    const readiness = consultation ? checkSlotReadiness(consultation.scheduledAt) : { ready: true };

                    return (
                        <div
                            key={q.id}
                            className="rounded-3xl p-6 flex flex-col gap-5 shadow-xs transition duration-150"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                        >
                            {/* Request Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#f5e4ec]">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center font-black text-sm">
                                        #{q.tokenNumber}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                                                {q.specialization ? `${q.specialization} Consultation` : (q.doctor?.fullName || 'General Consultation')}
                                            </h3>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffe6ee] text-[#8e1d41]">
                                                Token #{q.tokenNumber}
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                            Requested {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                                            {q.urgency && ` · Urgency: ${q.urgency.toUpperCase()}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {q.status === 'WAITING' && (
                                        <span
                                            className="font-bold px-3.5 py-1.5 rounded-full uppercase text-xs animate-pulse"
                                            style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)', border: '1px solid var(--pastel-peach-text)' }}
                                        >
                                            {isBroadcast ? (
                                                acceptedDoctors.length > 0 ? `${acceptedDoctors.length} Doctor(s) Offered Slots` : 'Broadcasting to Specialists'
                                            ) : 'Waiting for Doctor'}
                                        </span>
                                    )}
                                    {q.status === 'SERVING' && (
                                        <span
                                            className="font-bold px-3.5 py-1.5 rounded-full uppercase text-xs"
                                            style={
                                                readiness.ready
                                                    ? { background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)', border: '1px solid var(--pastel-mint-text)' }
                                                    : { background: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)' }
                                            }
                                        >
                                            {readiness.ready 
                                                ? 'Doctor Assigned · In Call' 
                                                : `Scheduled for ${readiness.targetTimeFormatted}`}
                                        </span>
                                    )}

                                    {q.status === 'WAITING' && (
                                        <button
                                            onClick={() => handleCancelQueue(q.id)}
                                            disabled={cancellingId === q.id}
                                            className="p-1.5 rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                            title="Cancel Request"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Symptoms & AI Triage Context */}
                            {(q.symptoms || q.temporaryDiagnosis) && (
                                <div className="p-3.5 rounded-2xl bg-[#fffcfd] border border-[#f5e4ec] text-xs flex flex-col gap-1">
                                    {q.temporaryDiagnosis && (
                                        <div>
                                            <span className="font-bold text-[#7d6974]">AI Triage: </span>
                                            <span className="font-semibold text-[#2d2329]">{q.temporaryDiagnosis}</span>
                                        </div>
                                    )}
                                    {q.symptoms && (
                                        <div>
                                            <span className="font-bold text-[#7d6974]">Symptoms: </span>
                                            <span className="font-medium text-[#4a3c45]">{q.symptoms}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Multi-Doctor Broadcast: Comparison & Selection Cards */}
                            {q.status === 'WAITING' && isBroadcast && (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-[#2d2329]">
                                            Available Doctor Offers ({acceptedDoctors.length})
                                        </h4>
                                        <span className="text-[11px] text-[#7d6974] font-semibold">
                                            Compare fees, rating &amp; pick your doctor
                                        </span>
                                    </div>

                                    {acceptedDoctors.length === 0 ? (
                                        <div className="p-6 rounded-2xl border border-dashed border-[#f5c6d6] bg-[#fffcfd] text-center flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 text-[#e13b68] animate-spin" />
                                            <p className="text-xs font-bold text-[#2d2329]">
                                                Broadcasting your request to {q.specialization || 'specialty'} doctors...
                                            </p>
                                            <p className="text-[11px] text-[#7d6974] font-medium">
                                                Matching doctors in this specialty receive your alert. Offers will appear here immediately.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                            {acceptedDoctors.map((doc, idx) => {
                                                const docId = doc.doctorId || doc.userId || doc;
                                                const docName = doc.fullName || `Doctor ${idx + 1}`;
                                                const fee = doc.consultationFee || 299;
                                                const rating = doc.avgRating || '4.9';
                                                const exp = doc.yearsOfExperience || 5;
                                                const slotStr = typeof doc.offeredTimeSlot === 'string' 
                                                    ? doc.offeredTimeSlot 
                                                    : doc.offeredTimeSlot?.label || 'Available Immediately';

                                                return (
                                                    <div
                                                        key={docId || idx}
                                                        className="p-4 rounded-2xl bg-white border border-[#f5e4ec] hover:border-[#e13b68] shadow-2xs hover:shadow-xs flex flex-col justify-between gap-3 transition"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center font-black text-sm shrink-0">
                                                                {docName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5">
                                                                    <h5 className="font-bold text-xs sm:text-sm text-[#2d2329]">
                                                                        Dr. {docName}
                                                                    </h5>
                                                                    <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                                                        {rating}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] font-semibold text-[#e13b68]">
                                                                    {doc.specialization || q.specialization || 'Specialist'}
                                                                </p>
                                                                <p className="text-[10px] text-[#7d6974] font-medium mt-0.5">
                                                                    {exp} yrs experience {doc.clinicName ? `· ${doc.clinicName}` : ''}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Doctor Offered Time Slot Badge */}
                                                        {slotStr && (
                                                            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                <span>Offered Slot: {slotStr}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-2 border-t border-[#f5e4ec]">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold uppercase text-[#7d6974]">Consultation Fee</span>
                                                                <span className="font-black text-xs text-[#2d2329]">₹{fee}</span>
                                                            </div>

                                                            <button
                                                                onClick={() => handleSelectDoctor(q.id, docId, slotStr, doc.slotMetadata)}
                                                                disabled={selectingDoctorId === docId}
                                                                className="px-4 py-1.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                            >
                                                                {selectingDoctorId === docId ? (
                                                                    <>
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                        <span>Confirming...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Video className="w-3 h-3" />
                                                                        <span>Choose &amp; Connect</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Direct Booking Active or In-Call Banner */}
                            {q.status === 'SERVING' && consultation && (
                                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                                    readiness.ready 
                                        ? 'bg-emerald-50 border-emerald-200' 
                                        : 'bg-amber-50/60 border-amber-200'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                                            readiness.ready ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}>
                                            {readiness.ready ? <Video className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-xs ${readiness.ready ? 'text-emerald-900' : 'text-amber-900'}`}>
                                                {readiness.ready 
                                                    ? 'Your Video Consultation is Live' 
                                                    : `Consultation Scheduled for ${readiness.targetTimeFormatted}`}
                                            </p>
                                            <p className={`text-[11px] font-medium ${readiness.ready ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {readiness.ready 
                                                    ? `Room ID: ${consultation.roomId?.slice(0, 8)}... Click to open teleconsultation window.`
                                                    : `Video connection will unlock at the allotted time. ${readiness.countdownText}.`}
                                            </p>
                                        </div>
                                    </div>

                                    {readiness.ready ? (
                                        <button
                                            onClick={() => navigate(`/patient/consultation/${consultation.id}/room`)}
                                            className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                                        >
                                            <Video className="w-3.5 h-3.5" />
                                            <span>Enter Video Room</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="px-3.5 py-1.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                                                <span>{readiness.countdownText}</span>
                                            </span>
                                            <button
                                                disabled
                                                className="px-4 py-2 rounded-full bg-stone-200 text-stone-500 font-bold text-xs cursor-not-allowed flex items-center gap-1.5 opacity-80"
                                            >
                                                <span>Connect at {readiness.targetTimeFormatted}</span>
                                            </button>
                                        </div>
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
