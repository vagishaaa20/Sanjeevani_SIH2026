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

            <div
                className="rounded-3xl p-8 flex flex-col gap-2 shadow-xs"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <h2 className="text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>My Active Requests</h2>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    View your waitlist position and live status.
                    Keep this page open—your doctor will call you when they are ready.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {loading && <p className="font-bold animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading your requests...</p>}
                {error && <p className="font-bold" style={{ color: 'var(--accent)' }}>{error}</p>}

                {!loading && !error && queue.length === 0 && (
                    <div
                        className="rounded-3xl p-10 text-center flex flex-col items-center justify-center shadow-xs"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <span className="text-4xl mb-4">🩺</span>
                        <h3 className="font-black text-xl mb-2" style={{ color: 'var(--text-primary)' }}>No Active Requests</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            You are not currently in any doctor's queue. Book an appointment to join.
                        </p>
                        <button
                            onClick={() => navigate('/patient/book-appointment')}
                            className="font-bold px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer text-white"
                            style={{ background: 'var(--accent)' }}
                        >
                            Find a Doctor
                        </button>
                    </div>
                )}

                {!loading && !error && queue.length > 0 && queue.map(q => (
                    <div
                        key={q.id}
                        className="rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <div className="flex flex-col gap-1">
                            <h3 className="font-black text-lg uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                                Token #{q.tokenNumber}
                            </h3>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Requested: {formatDistanceToNow(new Date(q.createdAt))} ago
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {q.status === 'WAITING' && (
                                <span
                                    className="font-bold px-4 py-2 rounded-xl uppercase text-xs animate-pulse shadow-sm"
                                    style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)', border: '1px solid var(--pastel-peach-text)' }}
                                >
                                    Waiting for Doctor
                                </span>
                            )}
                            {q.status === 'SERVING' && (
                                <span
                                    className="font-bold px-4 py-2 rounded-xl uppercase text-xs shadow-sm"
                                    style={{ background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)', border: '1px solid var(--pastel-mint-text)' }}
                                >
                                    Doctor Accepted
                                </span>
                            )}
                            {q.status === 'COMPLETED' && (
                                <span
                                    className="font-bold px-4 py-2 rounded-xl uppercase text-xs shadow-sm"
                                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                                >
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
