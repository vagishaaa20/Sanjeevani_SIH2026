import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import PreCallDocumentSubmit from '../../components/patient/PreCallDocumentSubmit';

export default function PatientRequests() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [acceptedConsultationId, setAcceptedConsultationId] = useState(null);

    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

    const fetchMyQueue = async () => {
        try {
            const res = await api.get('/queues/my');
            const newQueue = res.data.queue || [];

            // Fallback recovery: if we missed the socket event, but backend says SERVING
            const servingItem = newQueue.find(q => q.status === 'SERVING' && q.consultation);
            if (servingItem && !acceptedConsultationId) {
                setAcceptedConsultationId(servingItem.consultation.id);
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
        const interval = setInterval(fetchMyQueue, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleAccepted = (data) => {
            console.log('Doctor accepted!', data);
            setAcceptedConsultationId(data.consultationId);
            // We could also dynamically update the queue item status here,
            // but the modal will grab their focus anyway.
        };
        socket.on('consultation:accepted', handleAccepted);
        return () => socket.off('consultation:accepted', handleAccepted);
    }, [socket]);

    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 text-left relative min-h-[50vh]">

            {/* If doctor accepted, render the document upload modal over everything */}
            {acceptedConsultationId && (
                <PreCallDocumentSubmit consultationId={acceptedConsultationId} />
            )}

            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col gap-2 shadow-sm">
                <h2 className="text-3xl font-black text-ink-black">My Active Requests</h2>
                <p className="text-sm font-semibold text-ink-charcoal">
                    View your waitlist position and live status.
                    Keep this page open—your doctor will call you when they are ready.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {loading && <p className="font-bold text-ink-charcoal animate-pulse">Loading your requests...</p>}
                {error && <p className="font-bold text-red-600">{error}</p>}

                {!loading && !error && queue.length === 0 && (
                    <div className="bg-white border-2 border-ink-black rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                        <span className="text-4xl mb-4">🩺</span>
                        <h3 className="font-black text-xl text-ink-black mb-2">No Active Requests</h3>
                        <p className="text-sm text-ink-charcoal mb-6">
                            You are not currently in any doctor's queue. Book an appointment to join.
                        </p>
                        <button
                            onClick={() => navigate('/patient/book-appointment')}
                            className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl border-2 border-ink-black shadow-[2px_2px_0px_#111] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                        >
                            Find a Doctor
                        </button>
                    </div>
                )}

                {!loading && !error && queue.length > 0 && queue.map(q => (
                    <div key={q.id} className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-black text-lg text-ink-black uppercase tracking-wide">
                                Token #{q.tokenNumber}
                            </h3>
                            <p className="text-sm font-semibold text-ink-charcoal">
                                Requested: {formatDistanceToNow(new Date(q.createdAt))} ago
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {q.status === 'WAITING' && (
                                <span className="bg-amber-100 text-amber-800 border-2 border-amber-300 font-bold px-4 py-2 rounded-xl uppercase text-xs animate-pulse shadow-sm">
                                    Waiting for Doctor
                                </span>
                            )}
                            {q.status === 'SERVING' && (
                                <span className="bg-emerald-100 text-emerald-800 border-2 border-emerald-400 font-bold px-4 py-2 rounded-xl uppercase text-xs shadow-sm">
                                    Doctor Accepted
                                </span>
                                // Note: Typically they are routed to the room immediately, 
                                // but if they navigate away they might see this.
                            )}
                            {q.status === 'COMPLETED' && (
                                <span className="bg-gray-100 text-gray-800 border-2 border-gray-400 font-bold px-4 py-2 rounded-xl uppercase text-xs shadow-sm">
                                    Completed
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
