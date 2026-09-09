import { useEffect, useState } from 'react';
import api from '../../services/api';
import healthWorkerAdminService from '../../services/healthWorkerAdminService';

const EMPTY_FORM = { patientId: '', toClinicId: '', toDoctorId: '', specialization: '', reason: '', priority: 'NORMAL', appointmentDate: '' };

const DoctorReferralForm = () => {
    const [patients, setPatients] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);
    const [destType, setDestType] = useState('clinic');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch in parallel using allSettled to prevent one failure from breaking everything
                const results = await Promise.allSettled([
                    api.get('/doctors/queue'),
                    api.get('/clinics'),
                    api.get('/doctors'),
                    api.get('/doctors/patients/recent')
                ]);

                const uniquePatients = new Map();
                
                // Add patients from queue
                if (results[0].status === 'fulfilled' && results[0].value.data.queue) {
                    results[0].value.data.queue.forEach((entry) => {
                        if (entry.patient?.userId) uniquePatients.set(entry.patient.userId, entry.patient);
                    });
                }
                
                // Add recent patients
                if (results[3].status === 'fulfilled' && results[3].value.data.patients) {
                    results[3].value.data.patients.forEach((patient) => {
                        if (patient.id) uniquePatients.set(patient.id, patient);
                    });
                }
                
                setPatients([...uniquePatients.values()]);
                
                if (results[1].status === 'fulfilled') setClinics(results[1].value.data.clinics || []);
                if (results[2].status === 'fulfilled') setDoctors(results[2].value.data.doctors || []);

            } catch (err) {
                console.error("Failed to load referral form data:", err);
            }
        };
        fetchData();
    }, []);

    const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const payload = { 
                ...form, 
                appointmentDate: form.appointmentDate || null 
            };
            if (destType === 'clinic') payload.toDoctorId = null;
            if (destType === 'doctor') payload.toClinicId = null;
            
            await healthWorkerAdminService.createReferral(payload);
            setForm(EMPTY_FORM);
            setMessage({ type: 'success', text: 'Referral created successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Could not create referral' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-[4px_4px_0px_#111] text-left mt-6">
            <div className="mb-4">
                <h3 className="text-lg font-black text-ink-black uppercase tracking-widest">Create Patient Referral</h3>
                <p className="text-xs font-semibold text-ink-charcoal mt-1">Select a patient from your queue or past consultations to refer.</p>
            </div>
            
            {message.text && (
                <div className={`mb-4 p-3 rounded-xl border text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-700'}`}>
                    {message.text}
                </div>
            )}
            
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">
                    Patient
                    <select required value={form.patientId} onChange={(event) => update('patientId', event.target.value)} className="normal-case tracking-normal text-sm font-semibold border-2 border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-colors">
                        <option value="">Select patient</option>
                        {patients.map((patient) => (
                            <option key={patient.userId || patient.id} value={patient.userId || patient.id}>
                                {patient.fullName || patient.userId || patient.id} {patient.phone ? `(${patient.phone})` : ''}
                            </option>
                        ))}
                    </select>
                </label>
                
                <div className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">
                    Destination Type
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setDestType('clinic'); update('toDoctorId', ''); }} className={`flex-1 py-2.5 rounded-xl border-2 transition-colors ${destType === 'clinic' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>Clinic</button>
                        <button type="button" onClick={() => { setDestType('doctor'); update('toClinicId', ''); }} className={`flex-1 py-2.5 rounded-xl border-2 transition-colors ${destType === 'doctor' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>Doctor</button>
                    </div>
                </div>

                {destType === 'clinic' ? (
                    <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">
                        Destination clinic
                        <select required value={form.toClinicId} onChange={(event) => update('toClinicId', event.target.value)} className="normal-case tracking-normal text-sm font-semibold border-2 border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-colors">
                            <option value="">Select clinic</option>
                            {clinics.map((clinic) => (
                                <option key={clinic.userId} value={clinic.userId}>{clinic.clinicName} · {clinic.city}</option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">
                        Destination doctor
                        <select required value={form.toDoctorId} onChange={(event) => update('toDoctorId', event.target.value)} className="normal-case tracking-normal text-sm font-semibold border-2 border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-colors">
                            <option value="">Select doctor</option>
                            {doctors.map((doctor) => (
                                <option key={doctor.userId} value={doctor.userId}>Dr. {doctor.fullName} · {doctor.specialization}</option>
                            ))}
                        </select>
                    </label>
                )}

                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">
                    Specialization
                    <input required value={form.specialization} onChange={(event) => update('specialization', event.target.value)} placeholder="Cardiology" className="normal-case tracking-normal text-sm font-semibold border-2 border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-colors" />
                </label>
                
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider">
                    Priority
                    <select value={form.priority} onChange={(event) => update('priority', event.target.value)} className="normal-case tracking-normal text-sm font-semibold border-2 border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-colors">
                        <option>NORMAL</option>
                        <option>HIGH</option>
                        <option>URGENT</option>
                    </select>
                </label>
                
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider md:col-span-2 lg:col-span-1">
                    Appointment date
                    <input type="datetime-local" value={form.appointmentDate} onChange={(event) => update('appointmentDate', event.target.value)} className="normal-case tracking-normal text-sm font-semibold border-2 border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-colors" />
                </label>
                
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider md:col-span-2">
                    Reason
                    <textarea required value={form.reason} onChange={(event) => update('reason', event.target.value)} rows="3" placeholder="Reason for specialist referral" className="normal-case tracking-normal text-sm font-semibold border-2 border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-colors resize-none" />
                </label>
                
                <div className="md:col-span-2 flex justify-end mt-2">
                    <button type="submit" disabled={saving || !patients.length} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 border-2 border-black text-white font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_#111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                        {saving ? 'Creating...' : 'Create Referral'}
                    </button>
                </div>
            </form>
            {!patients.length && <p className="mt-4 p-3 bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-800 rounded-lg">You must have seen a patient or have one in your queue to create a referral.</p>}
        </section>
    );
};

export default DoctorReferralForm;