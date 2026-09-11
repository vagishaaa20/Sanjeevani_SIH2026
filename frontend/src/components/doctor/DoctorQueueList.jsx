import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
    Coffee
} from 'lucide-react';
import Badge from '../common/Badge';

export default function DoctorQueueList() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

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

    // Listen for real-time queue socket updates if available
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

    const handleAccept = async (queueId) => {
        try {
            const res = await api.post(`/doctors/queue/${queueId}/accept`);
            if (res.data.success && res.data.consultation) {
                // Route directly to the teleconsultation room 
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
        <div className="bg-white border border-[#f5e4ec] rounded-3xl flex flex-col overflow-hidden shadow-xs">
            {/* Queue Header */}
            <div className="p-5 md:p-6 border-b border-[#f5e4ec] bg-[#fffcfd] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base md:text-lg font-black text-[#2d2329] font-heading">
                                Live Patient Queue
                            </h3>
                            <span className="bg-[#ffe6ee] text-[#8e1d41] text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {queue.length} {queue.length === 1 ? 'Patient' : 'Patients'} Waiting
                            </span>
                        </div>
                        <p className="text-xs text-[#7d6974] font-medium mt-0.5">
                            Real-time teleconsultation waiting room
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => fetchQueue(true)}
                        disabled={refreshing}
                        className="p-2 rounded-xl text-[#7d6974] hover:text-[#e13b68] hover:bg-[#ffe6ee] transition"
                        title="Refresh Queue"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#e13b68]' : ''}`} />
                    </button>

                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
                            isOnline
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                        <span>{isOnline ? 'Accepting Patients (Online)' : 'Paused (Offline)'}</span>
                    </button>
                </div>
            </div>

            {/* Queue Content */}
            <div className="p-5 md:p-6 flex flex-col gap-4 max-h-[600px] overflow-y-auto bg-[#fffcfd]/50">
                {loading && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 text-[#e13b68] animate-spin" />
                        <p className="text-xs font-bold text-[#7d6974]">Fetching live patient queue…</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!loading && !error && queue.length === 0 && (
                    <div className="text-center py-12 px-4 flex flex-col gap-3 items-center justify-center">
                        <div className="w-16 h-16 rounded-3xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                            <Coffee className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-[#2d2329]">Queue is Clear</h4>
                            <p className="text-xs text-[#7d6974] font-medium mt-0.5 max-w-sm">
                                No patients are currently waiting for online consultation. New requests will appear here in real time.
                            </p>
                        </div>
                        <button
                            onClick={() => fetchQueue(true)}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ffe6ee] hover:bg-[#f5c6d6] text-[#8e1d41] text-xs font-bold transition shadow-2xs"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Check for New Patients</span>
                        </button>
                    </div>
                )}

                {queue.map((q, idx) => {
                    const patientName = q.patient?.fullName || q.patient?.name || 'Anonymous Patient';
                    const initials = patientName.charAt(0).toUpperCase();

                    return (
                        <div
                            key={q.id || idx}
                            className="bg-white border border-[#f5e4ec] hover:border-[#f5c6d6] rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-2xs hover:shadow-xs transition duration-150"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-[#ffe6ee] to-[#fffcfd] border border-[#f5c6d6] text-[#e13b68] flex items-center justify-center font-black text-base flex-shrink-0">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-bold text-sm text-[#2d2329]">
                                                {patientName}
                                            </h4>
                                            <span className="bg-[#ffe6ee] text-[#8e1d41] text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                #Token {q.tokenNumber || idx + 1}
                                            </span>
                                            {q.patient?.gender && (
                                                <span className="text-[11px] text-[#7d6974] font-medium">
                                                    · {q.patient.gender} {q.patient.age ? `, ${q.patient.age} yrs` : ''}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-[#7d6974] font-medium mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-[#7d6974]" />
                                                Waiting {formatDistanceToNow(new Date(q.createdAt || Date.now()), { addSuffix: true })}
                                            </span>
                                            {q.triageLevel && (
                                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                                    {q.triageLevel}
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

                            {/* Symptoms or Notes if present */}
                            {q.chiefComplaint && (
                                <div className="px-3.5 py-2 rounded-xl bg-[#fffcfd] border border-[#f5e4ec] text-xs text-[#4a3c45]">
                                    <span className="font-bold text-[#7d6974]">Reported Symptoms: </span>
                                    <span>{q.chiefComplaint}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#f5e4ec]">
                                <button
                                    onClick={() => handleSkip(q.id)}
                                    className="px-4 py-2 rounded-full border border-[#f5e4ec] bg-white hover:bg-zinc-50 text-[#7d6974] text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    <SkipForward className="w-3.5 h-3.5" />
                                    <span>Skip</span>
                                </button>
                                <button
                                    onClick={() => handleAccept(q.id)}
                                    className="px-5 py-2 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs hover:shadow-md transition duration-150 flex items-center gap-2"
                                >
                                    <Video className="w-4 h-4" />
                                    <span>Accept & Start Video Call</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
