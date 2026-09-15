import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { SocketContext } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { 
    Users, 
    Video, 
    Clock, 
    CheckCircle2, 
    SkipForward, 
    RefreshCw, 
    Sparkles, 
    ShieldCheck, 
    AlertCircle,
    Coffee,
    Calendar,
    Send,
    Loader2
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { generateDynamicFutureSlots } from '../../utils/timeSlots';

export default function DoctorQueueList() {
    const { user } = useAuth();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(
        user?.profile?.availability?.isAccepting !== false
    );
    const [togglingOnline, setTogglingOnline] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

    // Sync online state if user profile changes
    useEffect(() => {
        if (user?.profile?.availability) {
            setIsOnline(user.profile.availability.isAccepting !== false);
        }
    }, [user?.profile?.availability]);

    const handleToggleOnline = async () => {
        const nextStatus = !isOnline;
        setTogglingOnline(true);
        try {
            const currentAvail = user?.profile?.availability || {};
            await api.patch('/doctors/profile', {
                availability: {
                    ...currentAvail,
                    isAccepting: nextStatus
                }
            });
            setIsOnline(nextStatus);
            if (user?.profile) {
                user.profile.availability = {
                    ...(user.profile.availability || {}),
                    isAccepting: nextStatus
                };
            }
        } catch (err) {
            console.error('Failed to update availability status', err);
            alert('Failed to update status. Please try again.');
        } finally {
            setTogglingOnline(false);
        }
    };

    // Slot offering modal state
    const [slotModalQueue, setSlotModalQueue] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [customSlot, setCustomSlot] = useState('');
    const [customNote, setCustomNote] = useState('');
    const [offeringLoading, setOfferingLoading] = useState(false);

    const fetchQueue = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await api.get('/doctors/queue');
            setQueue(res.data.queue || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch doctor queue', err);
            setError('Could not load patient queue.');
        } finally {
            setLoading(false);
            if (isManual) setRefreshing(false);
        }
    };

    // Initial load and simple polling fallback
    useEffect(() => {
        fetchQueue();
        const interval = setInterval(() => fetchQueue(false), 15000);
        return () => clearInterval(interval);
    }, []);

    // Listen for real-time queue socket updates
    useEffect(() => {
        if (!socket) return;
        const handleQueueUpdate = () => {
            fetchQueue(false);
        };
        socket.on('queue:update', handleQueueUpdate);
        socket.on('queue:new_patient', handleQueueUpdate);
        return () => {
            socket.off('queue:update', handleQueueUpdate);
            socket.off('queue:new_patient', handleQueueUpdate);
        };
    }, [socket]);

    const handleAcceptDirect = async (queueId) => {
        try {
            const res = await api.post(`/doctors/queue/${queueId}/accept`);
            if (res.data.direct && res.data.consultation) {
                navigate(`/doctor/consultation/${res.data.consultation.id}/room`);
            } else {
                fetchQueue(true);
            }
        } catch (err) {
            console.error('Accept direct error', err);
            alert(err.response?.data?.error || 'Failed to start direct consultation');
        }
    };

    const handleOpenSlotModal = (q) => {
        setSlotModalQueue(q);
        const dynamicSlots = generateDynamicFutureSlots();
        setAvailableSlots(dynamicSlots);
        setSelectedSlot(dynamicSlots[0]);
        setCustomSlot('');
        setCustomNote('');
    };

    const handleSubmitSlotOffer = async () => {
        if (!slotModalQueue) return;
        setOfferingLoading(true);
        try {
            const finalSlot = customSlot.trim() 
                ? { label: customSlot.trim(), isImmediate: false } 
                : selectedSlot;
            const slotDisplayString = typeof finalSlot === 'object' ? finalSlot.label : finalSlot;

            const res = await api.post(`/doctors/queue/${slotModalQueue.id}/accept`, {
                offeredTimeSlot: finalSlot,
                customNote: customNote.trim() || undefined
            });

            // Update local state
            setQueue(prev => prev.map(item => item.id === slotModalQueue.id ? { 
                ...item, 
                isOfferedByMe: true, 
                myOfferedSlot: slotDisplayString 
            } : item));

            setSlotModalQueue(null);
        } catch (err) {
            console.error('Submit slot offer error:', err);
            alert(err.response?.data?.error || 'Failed to submit slot offer');
        } finally {
            setOfferingLoading(false);
        }
    };

    const handleSkip = async (queueId) => {
        try {
            await api.post(`/doctors/queue/${queueId}/skip`);
            setQueue((prev) => prev.filter((q) => q.id !== queueId));
        } catch (err) {
            console.error('Skip error', err);
            alert('Failed to skip request');
        }
    };

    return (
        <div
            className="rounded-3xl flex flex-col overflow-hidden shadow-xs text-left"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
            {/* Queue Header */}
            <div
                className="p-5 md:p-6 flex items-center justify-between gap-4 flex-wrap"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-bg)' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                        <Video className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base md:text-lg font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                                Live Teleconsultation Queue
                            </h3>
                            <span
                                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                            >
                                {queue.length} {queue.length === 1 ? 'Patient' : 'Patients'} Waiting
                            </span>
                        </div>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            Specialist broadcasts &amp; virtual teleconsultation waiting room
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => fetchQueue(true)}
                        disabled={refreshing}
                        className="p-2 rounded-xl transition cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Refresh Queue"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--accent)' }} />
                    </button>

                    <button
                        onClick={handleToggleOnline}
                        disabled={togglingOnline}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                        style={isOnline 
                            ? { background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }
                            : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                        }
                    >
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                        <span>{togglingOnline ? 'Updating...' : (isOnline ? 'Accepting Consultations (Online)' : 'Paused (Offline)')}</span>
                    </button>
                </div>
            </div>

            {/* Queue Content */}
            <div className="p-5 md:p-6 flex flex-col gap-4 max-h-[600px] overflow-y-auto">
                {loading && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
                        <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Fetching live virtual patient queue…</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!loading && !error && queue.length === 0 && (
                    <div className="text-center py-12 px-4 flex flex-col gap-3 items-center justify-center">
                        <div
                            className="w-16 h-16 rounded-3xl flex items-center justify-center"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            <Coffee className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Teleconsultation Queue is Clear</h4>
                            <p className="text-xs font-medium mt-0.5 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                                No patients are currently waiting for online video consultation. When patients broadcast requests, they will appear here.
                            </p>
                        </div>
                    </div>
                )}

                {queue.map((q, idx) => {
                    const patientName = q.patient?.fullName || q.patient?.name || 'Anonymous Patient';
                    const initials = patientName.charAt(0).toUpperCase();
                    const isPool = !q.doctorId;

                    return (
                        <div
                            key={q.id || idx}
                            className="rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-2xs hover:shadow-xs transition duration-150"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0"
                                        style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                                    >
                                        {initials}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {patientName}
                                            </h4>
                                            <span
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                            >
                                                #Token {q.tokenNumber || idx + 1}
                                            </span>
                                            {isPool && (
                                                <span className="bg-sky-500/10 text-sky-500 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    Specialty Broadcast
                                                </span>
                                            )}
                                            {q.patient?.gender && (
                                                <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                    · {q.patient.gender} {q.patient.age ? `, ${q.patient.age} yrs` : ''}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                                Waiting {formatDistanceToNow(new Date(q.createdAt || Date.now()), { addSuffix: true })}
                                            </span>
                                            {q.urgency && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                                    q.urgency === 'high' || q.urgency === 'critical' 
                                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' 
                                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                }`}>
                                                    Urgency: {q.urgency.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <Badge variant="peach" dot>
                                        In Waiting Room
                                    </Badge>
                                </div>
                            </div>

                            {/* Symptoms or Triage info if present */}
                            {(q.symptoms || q.chiefComplaint || q.temporaryDiagnosis) && (
                                <div
                                    className="px-3.5 py-2.5 rounded-xl text-xs flex flex-col gap-1"
                                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                >
                                    {q.temporaryDiagnosis && (
                                        <div>
                                            <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>AI Triage: </span>
                                            <span className="font-semibold">{q.temporaryDiagnosis}</span>
                                        </div>
                                    )}
                                    {(q.symptoms || q.chiefComplaint) && (
                                        <div>
                                            <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>Reported Symptoms: </span>
                                            <span>{q.symptoms || q.chiefComplaint}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => handleSkip(q.id)}
                                    className="px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    <SkipForward className="w-3.5 h-3.5" />
                                    <span>Skip</span>
                                </button>

                                {q.isOfferedByMe ? (
                                    <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Slot Offered ({q.myOfferedSlot || 'Sent'}) · Waiting for Patient</span>
                                    </span>
                                ) : isPool ? (
                                    <button
                                        onClick={() => handleOpenSlotModal(q)}
                                        className="px-5 py-2 rounded-full text-white text-xs font-bold shadow-xs transition duration-150 flex items-center gap-2 cursor-pointer hover:opacity-90"
                                        style={{ background: 'var(--accent)' }}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span>Accept &amp; Offer Time Slot</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAcceptDirect(q.id)}
                                        className="px-5 py-2 rounded-full text-white text-xs font-bold shadow-xs transition duration-150 flex items-center gap-2 cursor-pointer"
                                        style={{ background: 'var(--accent)' }}
                                    >
                                        <Video className="w-4 h-4" />
                                        <span>Accept &amp; Start Video Call</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Doctor Slot Offering Modal */}
            <Modal
                isOpen={!!slotModalQueue}
                onClose={() => setSlotModalQueue(null)}
                title="Offer Teleconsultation Time Slot"
            >
                <div className="flex flex-col gap-4 text-left">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Select when you are available for this virtual video consultation. Your offered timing and fee will reflect in the patient's dashboard for comparison.
                    </p>

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Available Time Presets:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {availableSlots.map((slot, idx) => {
                                const isSelected = selectedSlot?.label === slot.label && !customSlot;
                                return (
                                    <button
                                        key={slot.label || idx}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSlot(slot);
                                            setCustomSlot('');
                                        }}
                                        className="p-2.5 rounded-xl text-xs font-bold text-left border transition cursor-pointer flex items-center justify-between"
                                        style={
                                            isSelected
                                                ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--notif-unread-border)' }
                                                : { background: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }
                                        }
                                    >
                                        <span className="truncate">{slot.label}</span>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#e13b68] shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Or Custom Time / Note:
                        </label>
                        <input
                            type="text"
                            value={customSlot}
                            onChange={(e) => setCustomSlot(e.target.value)}
                            placeholder="e.g., Today at 06:15 PM sharp"
                            className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                            type="button"
                            onClick={() => setSlotModalQueue(null)}
                            className="flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmitSlotOffer}
                            disabled={offeringLoading}
                            className="flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer text-white shadow-xs hover:shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                            style={{ background: 'var(--accent)' }}
                        >
                            {offeringLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Submit Slot Offer</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
