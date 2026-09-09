import { useEffect, useState } from 'react';
import healthWorkerService from '../../services/healthWorkerService';

const HealthWorkerFollowups = () => {
    const [followups, setFollowups] = useState([]);
    const [patients, setPatients] = useState([]);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ patientId: '', followUpDate: '', type: 'CALL', notes: '' });
    
    const load = () => {
        healthWorkerService.getFollowups().then((data) => setFollowups(data.followups || [])).catch((err) => setError(err.response?.data?.error || 'Could not load follow-ups'));
        healthWorkerService.getPatients().then((data) => {
            const list = data.patients || [];
            setPatients(list);
            if (list.length > 0) setForm((prev) => ({ ...prev, patientId: list[0].patientId }));
        }).catch(() => {});
    };
    
    useEffect(() => { load(); }, []);
    const submit = async (event) => { event.preventDefault(); try { await healthWorkerService.createFollowup(form); setForm({ patientId: patients.length > 0 ? patients[0].patientId : '', followUpDate: '', type: 'CALL', notes: '' }); load(); } catch (err) { setError(err.response?.data?.error || 'Could not save follow-up'); } };
    return <div className="w-full flex flex-col gap-6 text-left"><div><h2 className="text-3xl font-black">Follow-ups</h2><p className="text-sm font-semibold">Record contact with an assigned patient.</p></div>{error && <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold">{error}</div>}<form onSubmit={submit} className="bg-white border-2 border-black rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3"><select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className="border-2 border-zinc-200 rounded-xl p-2.5"><option value="" disabled>Select a patient</option>{patients.map(p => <option key={p.patientId} value={p.patientId}>{p.name || p.patientId}</option>)}</select><input required type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className="border-2 border-zinc-200 rounded-xl p-2.5" /><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border-2 border-zinc-200 rounded-xl p-2.5"><option>CALL</option><option>VISIT</option><option>WHATSAPP</option><option>OTHER</option></select><input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="border-2 border-zinc-200 rounded-xl p-2.5" /><button type="submit" className="md:col-span-4 justify-self-end bg-black hover:bg-gray-800 text-white rounded-xl px-5 py-2.5 font-bold">Save Follow-up</button></form><div className="bg-white border-2 border-black rounded-2xl overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-[#f4efe6]"><tr><th className="px-4 py-3 text-left">Patient</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Notes</th></tr></thead><tbody>{followups.map((item) => <tr key={item.id} className="border-t border-zinc-200"><td className="px-4 py-3">{item.patient?.patientProfile?.fullName || item.patientId}</td><td className="px-4 py-3">{item.followUpDate}</td><td className="px-4 py-3">{item.type}</td><td className="px-4 py-3 font-bold">{item.status}</td><td className="px-4 py-3">{item.notes || '-'}</td></tr>)}</tbody></table></div></div>;
};

export default HealthWorkerFollowups;