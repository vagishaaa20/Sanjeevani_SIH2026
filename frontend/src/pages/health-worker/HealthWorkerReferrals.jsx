import { useEffect, useState } from 'react';
import healthWorkerService from '../../services/healthWorkerService';

const HealthWorkerReferrals = () => {
    const [referrals, setReferrals] = useState([]);
    const [error, setError] = useState('');
    const load = () => healthWorkerService.getReferrals().then((data) => setReferrals(data.referrals || [])).catch((err) => setError(err.response?.data?.error || 'Could not load referrals'));
    useEffect(() => { load(); }, []);
    const update = async (id, status) => { try { await healthWorkerService.updateReferral(id, status); load(); } catch (err) { setError(err.response?.data?.error || 'Could not update referral'); } };
    return <div className="w-full flex flex-col gap-6 text-left"><div><h2 className="text-3xl font-black">Referrals</h2><p className="text-sm font-semibold">Track referrals for your assigned patients.</p></div>{error && <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold">{error}</div>}<div className="bg-white border-2 border-black rounded-2xl overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-[#f4efe6]"><tr><th className="px-4 py-3 text-left">Patient</th><th className="px-4 py-3 text-left">Reason</th><th className="px-4 py-3 text-left">Priority</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Action</th></tr></thead><tbody>{referrals.map((item) => <tr key={item.id} className="border-t border-zinc-200"><td className="px-4 py-3">{item.patient?.patientProfile?.fullName || item.patientId}</td><td className="px-4 py-3">{item.reason}</td><td className="px-4 py-3 font-bold">{item.priority}</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3"><select value={item.status} onChange={(e) => update(item.id, e.target.value)} className="border border-zinc-300 rounded-lg p-1.5"><option>PENDING</option><option>ACCEPTED</option><option>SCHEDULED</option><option>COMPLETED</option><option>CANCELLED</option></select></td></tr>)}</tbody></table>{!referrals.length && <div className="p-8 text-center text-ink-muted">No referrals for assigned patients.</div>}</div></div>;
};

export default HealthWorkerReferrals;