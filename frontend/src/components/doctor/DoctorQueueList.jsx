import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

export default function DoctorQueueList() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

    const fetchQueue = async () => {
        try {
            const res = await api.get('/doctors/queue');
            setQueue(res.data.queue || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch doctor queue', err);
            setError('Could not load patient queue.');
        } finally {
            setLoading(false);
        }
    };

    // Initial load and simple polling (fallback if socket breaks)
    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleAccept = async (queueId) => {
        try {
            const res = await api.post(`/doctors/queue/${queueId}/accept`);
            if (res.data.success && res.data.consultation) {
                // Route directly to the waiting room 
                navigate(`/doctor/consultation/${res.data.consultation.id}/room`);
            }
        } catch (err) {
            console.error('Accept error', err);
            alert(err.response?.data?.error || 'Failed to accept consultation');
        }
    };

    const handleSkip = async (queueId) => {
        try {
            await api.post(`/doctors/queue/${queueId}/skip`);
            // Optimistic update
            setQueue((prev) => prev.filter((q) => q.id !== queueId));
        } catch (err) {
            console.error('Skip error', err);
            alert('Failed to skip request');
        }
    };

    return (
        <div className="bg-white border-2 border-ink-black rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b-2 border-ink-black bg-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-ink-black uppercase tracking-wider">Patient Queue</h3>
                    <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {queue.length}
                    </span>
                </div>
                <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border-2 border-ink-black transition-colors ${isOnline ? 'bg-emerald-400 text-ink-black' : 'bg-gray-200 text-gray-600'
                        }`}
                >
                    {isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}
                </button>
            </div>

            <div className="p-4 flex flex-col gap-4 max-h-[600px] overflow-y-auto bg-stone-50">
                {loading && <p className="text-sm font-semibold text-ink-charcoal animate-pulse">Loading queue...</p>}
                {error && <p className="text-sm font-bold text-red-600">{error}</p>}

                {!loading && !error && queue.length === 0 && (
                    <div className="text-center py-10 flex flex-col gap-2 items-center text-ink-muted">
                        <span className="text-3xl">☕</span>
                        <p className="text-sm font-semibold">No patients waiting right now.</p>
                    </div>
                )}

                {queue.map((q) => (
                    <div key={q.id} className="bg-white border-2 border-ink-black rounded-xl p-4 flex flex-col gap-4 shadow-[2px_2px_0px_#111]">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-ink-black">
                                    {q.patient?.fullName || 'Anonymous Patient'}
                                    <span className="text-xs font-normal text-ink-charcoal ml-2">#Token {q.tokenNumber}</span>
                                </h4>
                                <p className="text-xs font-semibold text-ink-charcoal uppercase mt-1">
                                    Wait time: {formatDistanceToNow(new Date(q.createdAt))}
                                </p>
                            </div>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded border border-amber-300 uppercase">
                                Waiting
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                                onClick={() => handleSkip(q.id)}
                                className="py-2 border-2 border-ink-black rounded-lg text-ink-black text-xs font-bold bg-white hover:bg-gray-100 transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                onClick={() => handleAccept(q.id)}
                                className="py-2 border-2 border-ink-black rounded-lg text-white text-xs font-bold bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-[2px_2px_0px_#111] hover:shadow-[4px_4px_0px_#111] active:shadow-none"
                            >
                                Accept & Join 🎥
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
