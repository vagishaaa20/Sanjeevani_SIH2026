import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import PreCallDocumentSubmit from './PreCallDocumentSubmit';
import { checkSlotReadiness } from '../../utils/timeSlots';
import { 
    Clock, 
    Video, 
    CheckCircle2, 
    ArrowRight, 
    Stethoscope, 
    User, 
    X,
    Star,
    Sparkles,
    Lock
} from 'lucide-react';

export default function ActiveQueueBanner({ onStateChange }) {
    const [activeQueue, setActiveQueue] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [, setTick] = useState(Date.now());
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

    // 1-second interval to update time-gated buttons in real-time
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const checkQueue = async () => {
        try {
            const res = await api.get('/queues/my');
            const queues = res.data.queue || [];
            // Find SERVING first, otherwise WAITING
            const active = queues.find(q => q.status === 'SERVING') || queues.find(q => q.status === 'WAITING');
            setActiveQueue(active || null);
            if (onStateChange) onStateChange(active || null);
        } catch (err) {
            console.error('Failed to check active queues for banner', err);
        }
    };

    useEffect(() => {
        checkQueue();
        const interval = setInterval(checkQueue, 6000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleEvent = () => checkQueue();

        socket.on('consultation:accepted', handleEvent);
        socket.on('consultation:doctor_accepted', handleEvent);
        socket.on('consultation:confirmed', handleEvent);
        socket.on('consultation:completed', handleEvent);
        socket.on('queue:update', handleEvent);

        return () => {
            socket.off('consultation:accepted', handleEvent);
            socket.off('consultation:doctor_accepted', handleEvent);
            socket.off('consultation:confirmed', handleEvent);
            socket.off('consultation:completed', handleEvent);
            socket.off('queue:update', handleEvent);
        };
    }, [socket]);

    const handleJoinClick = () => {
        if (activeQueue && activeQueue.consultation) {
            setIsJoining(true);
        }
    };

    const handleCancelRequest = async () => {
        if (!activeQueue) return;
        if (!window.confirm('Are you sure you want to cancel this consultation request?')) return;
        setCancelling(true);
        try {
            await api.post(`/queues/${activeQueue.id}/cancel`);
            setActiveQueue(null);
            if (onStateChange) onStateChange(null);
        } catch (err) {
            console.error('Failed to cancel queue request', err);
            alert('Failed to cancel request. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    if (!activeQueue) return null;

    // Hide if specifically completed/missed by consultation state
    if (activeQueue.consultation && ['completed', 'missed'].includes(activeQueue.consultation.status)) {
        return null;
    }

    const cStatus = activeQueue.consultation?.status;
    const isRejoinable = cStatus === 'in_progress' || cStatus === 'disconnected';
    const acceptedDoctors = Array.isArray(activeQueue.acceptedDoctorIds) ? activeQueue.acceptedDoctorIds : [];
    const hasOffers = acceptedDoctors.length > 0;
    const readiness = activeQueue.consultation 
        ? checkSlotReadiness(activeQueue.consultation.scheduledAt) 
        : { ready: true };

    return (
        <>
            {isJoining && activeQueue.consultation && (
                <PreCallDocumentSubmit consultationId={activeQueue.consultation.id} />
            )}

            <div
                className="w-full rounded-3xl overflow-hidden shadow-xs flex flex-col p-5 sm:p-6 gap-4 animate-fade-in text-left"
                style={{
                    background: activeQueue.status === 'WAITING' 
                        ? (hasOffers ? 'var(--card-bg)' : 'var(--card-bg)') 
                        : isRejoinable ? 'rgba(59, 130, 246, 0.08)' : 'var(--card-bg)',
                    border: hasOffers ? '2px solid #10b981' : '1px solid var(--border)'
                }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div
                            className="flex flex-col items-center justify-center rounded-2xl w-12 h-12 shrink-0 font-black"
                            style={{ 
                                background: hasOffers ? 'rgba(16, 185, 129, 0.12)' : 'var(--accent-light)', 
                                color: hasOffers ? '#10b981' : 'var(--accent)',
                                border: '1px solid var(--border)'
                            }}
                        >
                            <span className="text-[9px] uppercase leading-none font-bold">Token</span>
                            <span className="text-lg font-black leading-none mt-0.5">#{activeQueue.tokenNumber || 1}</span>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                                    {activeQueue.status === 'WAITING' 
                                        ? (hasOffers ? `${acceptedDoctors.length} Doctor Offer${acceptedDoctors.length > 1 ? 's' : ''} Received!` : 'Teleconsultation Request Active')
                                        : isRejoinable 
                                        ? 'Video Consultation Disconnected' 
                                        : readiness.ready 
                                        ? 'Doctor is Ready to Connect!' 
                                        : `Scheduled for ${readiness.targetTimeFormatted}`}
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                    hasOffers 
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                                        : activeQueue.status === 'WAITING'
                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse'
                                        : readiness.ready
                                        ? 'bg-sky-500/10 text-sky-600 border-sky-500/30'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                }`}>
                                    {hasOffers 
                                        ? `${acceptedDoctors.length} Accepted` 
                                        : activeQueue.status === 'WAITING' 
                                        ? 'Broadcasting to Specialists' 
                                        : readiness.ready 
                                        ? 'Ready' 
                                        : readiness.countdownText}
                                </span>
                            </div>

                            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {activeQueue.status === 'WAITING'
                                    ? hasOffers
                                        ? 'Specialist doctors have reviewed your symptoms and offered available time slots.'
                                        : `Your symptoms are being broadcast to verified specialists. Doctors will offer time slots shortly.`
                                    : isRejoinable
                                        ? 'Call in progress — tap below to rejoin the video room.'
                                        : readiness.ready
                                        ? 'Doctor is waiting in the video room. Tap Join to begin your consultation.'
                                        : `Consultation confirmed. Video room opens at ${readiness.targetTimeFormatted} (${readiness.countdownText}).`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                        {activeQueue.status === 'WAITING' && (
                            <>
                                <button
                                    onClick={handleCancelRequest}
                                    disabled={cancelling}
                                    className="px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer hover:opacity-80"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
                                >
                                    {cancelling ? 'Cancelling...' : 'Cancel Request'}
                                </button>

                                {hasOffers ? (
                                    <button
                                        onClick={() => navigate('/patient/requests')}
                                        className="px-5 py-2 rounded-full text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer hover:opacity-95"
                                        style={{ background: '#10b981' }}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Choose Doctor ({acceptedDoctors.length})</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate('/patient/requests')}
                                        className="px-5 py-2 rounded-full text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                                        style={{ background: 'var(--accent)' }}
                                    >
                                        <span>Track Live Status</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </>
                        )}

                        {activeQueue.status === 'SERVING' && (
                            readiness.ready ? (
                                <button
                                    onClick={handleJoinClick}
                                    className="px-6 py-2.5 text-white rounded-full text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 cursor-pointer animate-pulse"
                                    style={{
                                        background: isRejoinable ? 'rgb(37, 99, 235)' : 'var(--accent)'
                                    }}
                                >
                                    <Video className="w-4 h-4" />
                                    <span>{isRejoinable ? 'Rejoin Call' : 'Join Video Room'}</span>
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
                                        <span>Opens at {readiness.targetTimeFormatted}</span>
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Offer previews if any doctors offered slots */}
                {hasOffers && activeQueue.status === 'WAITING' && (
                    <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                            <span>Incoming Specialist Offers:</span>
                            <button 
                                onClick={() => navigate('/patient/requests')} 
                                className="text-xs font-bold underline cursor-pointer"
                                style={{ color: 'var(--accent)' }}
                            >
                                View full details &amp; compare
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {acceptedDoctors.map((doc, idx) => {
                                const docName = typeof doc === 'object' ? doc.fullName || `Doctor ${idx + 1}` : `Verified Doctor #${idx + 1}`;
                                const slot = typeof doc === 'object' ? doc.offeredTimeSlot || 'Available soon' : 'Slot Offered';
                                const fee = typeof doc === 'object' ? doc.consultationFee || 500 : 500;
                                return (
                                    <div 
                                        key={idx}
                                        onClick={() => navigate('/patient/requests')}
                                        className="p-3 rounded-2xl flex flex-col gap-1 border cursor-pointer hover:shadow-2xs transition"
                                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                                                Dr. {docName}
                                            </span>
                                            <span className="font-black text-xs" style={{ color: '#10b981' }}>
                                                ₹{fee}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                                            <span className="truncate">{slot}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
