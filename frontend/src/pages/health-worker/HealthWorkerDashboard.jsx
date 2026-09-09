import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import healthWorkerService from '../../services/healthWorkerService';

const STAT_LABELS = [
    ['assignedPatients', 'Assigned Patients', 'patients'],
    ['highRiskPatients', 'High Risk Patients', 'patients needing attention'],
    ['pendingReferrals', 'Pending Referrals', 'referrals to track'],
    ['followupsDue', 'Follow-ups Due', 'due today or earlier'],
];

const HealthWorkerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        healthWorkerService.getDashboard().then((dashboardData) => setStats(dashboardData)).catch((err) => setError(err.response?.data?.error || 'Could not load dashboard'));
    }, []);

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 shadow-sm">
                <h2 className="text-3xl font-black text-ink-black">Health Worker Dashboard</h2>
                <p className="text-sm font-semibold text-ink-charcoal mt-1">Support assigned patients through follow-up and referral care.</p>
            </div>
            {error && <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_LABELS.map(([key, label, caption]) => (
                    <div key={key} className="bg-white border-2 border-ink-black rounded-2xl p-5 shadow-sm">
                        <div className="text-3xl font-black text-ink-black">{stats?.[key] ?? '...'}</div>
                        <div className="font-bold text-ink-charcoal mt-2">{label}</div>
                        <div className="text-xs text-ink-muted mt-1">{caption}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/health-worker/patients" className="bg-ink-black text-white rounded-2xl p-5 font-black hover:bg-ink-charcoal">My Patients</Link>
                <Link to="/health-worker/referrals" className="bg-white border-2 border-ink-black rounded-2xl p-5 font-black hover:bg-cream-surface">Referrals</Link>
                <Link to="/health-worker/followups" className="bg-white border-2 border-ink-black rounded-2xl p-5 font-black hover:bg-cream-surface">Follow-ups</Link>
            </div>
        </div>
    );
};

export default HealthWorkerDashboard;