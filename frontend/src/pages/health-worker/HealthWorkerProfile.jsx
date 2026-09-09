import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import healthWorkerService from '../../services/healthWorkerService';

const HealthWorkerProfile = () => {
    const { user, refreshProfile } = useAuth();
    const [form, setForm] = useState({ name: '', phone: '', workerType: 'COMMUNITY_WORKER' });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setForm({ name: user?.profile?.name || '', phone: user?.phone || '', workerType: user?.profile?.workerType || 'COMMUNITY_WORKER' });
    }, [user]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await healthWorkerService.updateProfile(form);
            await refreshProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Could not update profile' });
        } finally { setSaving(false); }
    };

    return <div className="w-full flex flex-col gap-6 text-left"><div><h2 className="text-3xl font-black">My Profile</h2><p className="text-sm font-semibold">Update your contact and worker details.</p></div>{message.text && <div className={`p-3 rounded-xl border font-semibold ${message.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-700'}`}>{message.text}</div>}<form onSubmit={submit} className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4 max-w-2xl"><label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5" /></label><label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5" /></label><label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">Worker type<select value={form.workerType} onChange={(event) => setForm({ ...form, workerType: event.target.value })} className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5"><option>ASHA</option><option>ANM</option><option>COMMUNITY_WORKER</option><option>OTHER</option></select></label><button disabled={saving} className="self-end px-5 py-2.5 rounded-xl bg-ink-black text-white font-bold disabled:opacity-50">{saving ? 'Saving...' : 'Save Profile'}</button></form></div>;
};

export default HealthWorkerProfile;