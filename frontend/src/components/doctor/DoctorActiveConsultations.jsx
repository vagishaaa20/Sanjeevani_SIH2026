import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Video, Clock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import Badge from '../common/Badge';

export default function DoctorActiveConsultations() {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [endingId, setEndingId] = useState(null);
    const navigate = useNavigate();

    const fetchActive = async () => {
        try {
            const res = await api.get('/consultations/active');
            setConsultations(res.data.consultations || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch active consultations', err);
            setError('Could not load ongoing calls.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkOver = async (id, e) => {
        e.stopPropagation();
        setEndingId(id);
        try {
            await api.post(`/consultations/${id}/end`);
            setConsultations((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            console.error('Failed to mark consultation over', err);
        } finally {
            setEndingId(null);
        }
    };

    useEffect(() => {
        fetchActive();
        const interval = setInterval(fetchActive, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading || error || consultations.length === 0) return null;

    return (
        <div
            className="rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4 animate-fade-in"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-sm md:text-base font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        Ongoing Teleconsultation In Progress
                    </h3>
                </div>
                <Badge variant="mint" dot>
                    {consultations.length} Active Session{consultations.length > 1 ? 's' : ''}
                </Badge>
            </div>

            <div className="flex flex-col gap-3">
                {consultations.map((c) => {
                    const patientName = c.patient?.fullName || c.patient?.name || 'Anonymous Patient';
                    return (
                        <div
                            key={c.id}
                            className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black"
                                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                >
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{patientName}</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold uppercase">
                                            {c.status?.replace('_', ' ') || 'CONNECTED'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Started: {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleMarkOver(c.id, e)}
                                    disabled={endingId === c.id}
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer border"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--card-bg)' }}
                                    title="Mark consultation as finished/over"
                                >
                                    {endingId === c.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    )}
                                    <span>Mark Over</span>
                                </button>

                                <button
                                    onClick={() => navigate(`/doctor/consultation/${c.id}/room`)}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Rejoin Video Room</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
