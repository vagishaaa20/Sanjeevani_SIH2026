import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import highRiskService from '../../services/highRiskService';
import Badge from '../../components/common/Badge';
import { ShieldAlert, Activity, ArrowRight, User as UserIcon } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

const HighRiskPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        highRiskService.getPatients()
            .then(data => {
                setPatients(data.patients);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load high risk patients');
                setLoading(false);
            });
    }, []);

    const isOverdue = (nextFollowupAt) => {
        if (!nextFollowupAt) return false;
        const nextDate = new Date(nextFollowupAt);
        const today = new Date();
        // Reset time for accurate date comparison
        today.setHours(0, 0, 0, 0);
        return nextDate < today;
    };

    if (loading) return <div className="p-8 text-center text-[#7d6974] font-bold animate-pulse">Loading High-Risk Patients...</div>;

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            <PageHeader 
                title="High-Risk Patients" 
                subtitle="Monitor and coordinate care for patients requiring close attention."
                icon={ShieldAlert}
            />

            {error && (
                <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs">
                    {error}
                </div>
            )}

            <div className="bg-cream-card border border-[#f5e4ec] rounded-3xl overflow-hidden shadow-xs">
                {patients.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-[#fdf5f7] flex items-center justify-center text-[#e13b68]">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-black text-[#2d2329]">No high-risk patients</h3>
                        <p className="text-xs font-semibold text-[#7d6974]">You currently have no assigned patients marked as high risk.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#fdf5f7] border-b border-[#f8e7ee]">
                                    <th className="p-4 text-xs font-black text-[#2d2329] uppercase tracking-wider">Patient</th>
                                    <th className="p-4 text-xs font-black text-[#2d2329] uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-black text-[#2d2329] uppercase tracking-wider">Next Follow-up</th>
                                    <th className="p-4 text-xs font-black text-[#2d2329] uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map(p => {
                                    const overdue = p.status !== 'RESOLVED' && isOverdue(p.nextFollowupAt);
                                    
                                    return (
                                        <tr key={p.id} className="border-b border-[#f5e4ec] hover:bg-[#fdf5f7] transition">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#ffe6ee] flex items-center justify-center text-[#e13b68]">
                                                        <UserIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-[#2d2329]">
                                                            {p.patientProfile?.fullName || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-[#7d6974]">
                                                            Risk: {p.riskLevel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={p.status === 'RESOLVED' ? 'mint' : p.status === 'ESCALATED' ? 'peach' : 'lavender'}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-[#2d2329]">
                                                        {p.nextFollowupAt ? new Date(p.nextFollowupAt).toLocaleDateString() : 'Not Scheduled'}
                                                    </span>
                                                    {overdue && (
                                                        <Badge variant="pink">OVERDUE</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Link 
                                                    to={`/health-worker/high-risk/${p.patientId}`}
                                                    className="inline-flex items-center justify-center p-2 rounded-xl bg-cream-card border border-[#f5e4ec] hover:bg-[#fdf0f4] hover:border-[#f8c8d8] text-[#e13b68] transition"
                                                    title="View Details"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HighRiskPatients;
