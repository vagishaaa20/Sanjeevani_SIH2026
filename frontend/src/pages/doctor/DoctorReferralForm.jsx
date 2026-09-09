import { useEffect, useState } from 'react';
import api from '../../services/api';
import healthWorkerAdminService from '../../services/healthWorkerAdminService';

const EMPTY_FORM = { patientId: '', toClinicId: '', specialization: '', reason: '', priority: 'NORMAL', appointmentDate: '' };

const DoctorReferralForm = () => {
    const [patients, setPatients] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([api.get('/doctors/queue'), api.get('/clinics')])
            .then(([queueResponse, clinicResponse]) => {
                const uniquePatients = new Map();
                (queueResponse.data.queue || []).forEach((entry) => {
                    if (entry.patient?.userId) uniquePatients.set(entry.patient.userId, entry.patient);
                });
                setPatients([...uniquePatients.values()]);
                setClinics(clinicResponse.data.clinics || []);
            })
            .catch((error) => setMessage({ type: 'error', text: error.response?.data?.error || 'Could not load referral options' }));
    }, []);

    const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await healthWorkerAdminService.createReferral({ ...form, appointmentDate: form.appointmentDate || null });
            setForm(EMPTY_FORM);
            setMessage({ type: 'success', text: 'Referral created successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Could not create referral' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm text-left">
            <div className="mb-4"><h3 className="text-lg font-black text-ink-black">Create Patient Referral</h3><p className="text-xs font-semibold text-ink-charcoal mt-1">Patients currently in your consultation queue are available to refer.</p></div>
            {message.text && <div className={`mb-4 p-3 rounded-xl border text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-700'}`}>{message.text}</div>}
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">Patient<select required value={form.patientId} onChange={(event) => update('patientId', event.target.value)} className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5"><option value="">Select patient</option>{patients.map((patient) => <option key={patient.userId} value={patient.userId}>{patient.fullName || patient.userId}</option>)}</select></label>
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">Destination clinic<select required value={form.toClinicId} onChange={(event) => update('toClinicId', event.target.value)} className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5"><option value="">Select clinic</option>{clinics.map((clinic) => <option key={clinic.userId} value={clinic.userId}>{clinic.clinicName} · {clinic.city}</option>)}</select></label>
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">Specialization<input required value={form.specialization} onChange={(event) => update('specialization', event.target.value)} placeholder="Cardiology" className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5" /></label>
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">Priority<select value={form.priority} onChange={(event) => update('priority', event.target.value)} className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5"><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select></label>
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">Appointment date<input type="datetime-local" value={form.appointmentDate} onChange={(event) => update('appointmentDate', event.target.value)} className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5" /></label>
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider md:col-span-2">Reason<textarea required value={form.reason} onChange={(event) => update('reason', event.target.value)} rows="3" placeholder="Reason for specialist referral" className="normal-case tracking-normal text-sm font-normal border-2 border-zinc-200 rounded-xl p-2.5" /></label>
                <div className="md:col-span-2 flex justify-end"><button type="submit" disabled={saving || !patients.length} className="px-5 py-2.5 rounded-xl bg-ink-black text-white font-bold disabled:opacity-50">{saving ? 'Creating...' : 'Create Referral'}</button></div>
            </form>
            {!patients.length && <p className="mt-3 text-xs font-semibold text-amber-700">No patients are currently available in your queue.</p>}
        </section>
    );
};

export default DoctorReferralForm;