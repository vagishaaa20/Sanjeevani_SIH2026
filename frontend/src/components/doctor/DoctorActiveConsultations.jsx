import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

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
        // Check every 10 seconds for any dropped states
        const interval = setInterval(fetchActive, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;
    if (error) return null;
    if (consultations.length === 0) return null;

    return (
        <div className="bg-sky-50 border-2 border-cerulean-dark rounded-2xl flex flex-col overflow-hidden mb-6">
            <div className="p-3 border-b-2 border-cerulean-dark bg-cerulean-dark text-white flex items-center gap-2">
                <span className="animate-pulse flex items-center justify-center w-2 h-2 bg-white rounded-full mx-1"></span>
                <h3 className="text-sm font-black uppercase tracking-wider">Ongoing Consultations</h3>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                    {consultations.length} Active
                </span>
            </div>

            <div className="p-4 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                {consultations.map((c) => (
                    <div key={c.id} className="bg-white border-2 border-ink-black rounded-lg p-3 flex justify-between items-center shadow-sm">
                        <div className="flex flex-col">
                            <h4 className="font-bold text-ink-black">
                                {c.patient?.fullName || 'Anonymous Patient'}
                                <span className="text-[10px] ml-2 px-1 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase">
                                    {c.status.replace('_', ' ')}
                                </span>
                            </h4>
                            <p className="text-[10px] text-ink-charcoal font-semibold uppercase mt-0.5">
                                Started: {new Date(c.createdAt).toLocaleTimeString()}
                            </p>
                        </div>

                        <button
                            onClick={() => navigate(`/doctor/consultation/${c.id}/room`)}
                            className="px-4 py-1.5 border-2 border-ink-black rounded text-white text-xs font-bold bg-cerulean-dark hover:bg-cerulean transition-colors shadow-sm"
                        >
                            Rejoin Call 🎥
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
