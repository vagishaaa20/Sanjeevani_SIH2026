import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Video, Clock, ArrowRight, UserCheck } from 'lucide-react';
import Badge from '../common/Badge';

export default function DoctorActiveConsultations() {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    useEffect(() => {
        fetchActive();
        const interval = setInterval(fetchActive, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading || error || consultations.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-[#ffe6ee]/50 via-white to-sky-50/50 border border-[#f5c6d6] rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-sm md:text-base font-black text-[#2d2329] font-heading">
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
                            className="bg-white border border-[#f5e4ec] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center font-black">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-[#2d2329]">{patientName}</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase">
                                            {c.status?.replace('_', ' ') || 'CONNECTED'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#7d6974] font-medium flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Started: {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/doctor/consultation/${c.id}/room`)}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs hover:shadow-md transition"
                            >
                                <Video className="w-3.5 h-3.5" />
                                <span>Rejoin Video Room</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
