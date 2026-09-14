import { useEffect, useState } from 'react';
import api from '../../services/api';
import healthWorkerAdminService from '../../services/healthWorkerAdminService';
import { Send, CheckCircle2, AlertCircle, User, Building, Stethoscope, Loader2 } from 'lucide-react';

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
            setMessage({ type: 'success', text: 'Referral created and dispatched successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Could not create referral' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section 
            className="rounded-3xl p-6 md:p-8 shadow-xs text-left"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
            <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-1">
                    <span 
                        className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                        Referral Poster
                    </span>
                </div>
                <h3 className="text-xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>Create Patient Referral</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Refer patients from your queue or recent consultations to specialized hospitals or doctors.
                </p>
            </div>
            
            {message.text && (
                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
                    message.type === 'success' 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500' 
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}
            
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        Select Patient <span className="text-rose-500">*</span>
                    </label>
                    <select
                        required
                        value={form.patientId}
                        onChange={(event) => update('patientId', event.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs cursor-pointer"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        <option value="">Choose patient from queue / history</option>
                        {patients.map((patient) => (
                            <option key={patient.userId || patient.id} value={patient.userId || patient.id}>
                                {patient.fullName || patient.userId || patient.id} {patient.phone ? `(${patient.phone})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        Destination Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { setDestType('clinic'); update('toDoctorId', ''); }}
                            className="flex-1 py-2 rounded-2xl text-xs font-bold transition cursor-pointer"
                            style={destType === 'clinic' ? {
                                background: 'var(--accent)',
                                color: '#ffffff',
                                boxShadow: '0 2px 8px rgba(225,59,104,0.3)',
                            } : {
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            Hospital / Clinic
                        </button>
                        <button
                            type="button"
                            onClick={() => { setDestType('doctor'); update('toClinicId', ''); }}
                            className="flex-1 py-2 rounded-2xl text-xs font-bold transition cursor-pointer"
                            style={destType === 'doctor' ? {
                                background: 'var(--accent)',
                                color: '#ffffff',
                                boxShadow: '0 2px 8px rgba(225,59,104,0.3)',
                            } : {
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            Specialist Doctor
                        </button>
                    </div>
                </div>

                {destType === 'clinic' ? (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                            Destination Clinic / Hospital <span className="text-rose-500">*</span>
                        </label>
                        <select
                            required
                            value={form.toClinicId}
                            onChange={(event) => update('toClinicId', event.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs cursor-pointer"
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                            <option value="">Select hospital / medical center</option>
                            {clinics.map((clinic) => (
                                <option key={clinic.userId} value={clinic.userId}>
                                    {clinic.clinicName} · {clinic.city}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                            Destination Doctor <span className="text-rose-500">*</span>
                        </label>
                        <select
                            required
                            value={form.toDoctorId}
                            onChange={(event) => update('toDoctorId', event.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs cursor-pointer"
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                            <option value="">Select specialist practitioner</option>
                            {doctors.map((doctor) => (
                                <option key={doctor.userId} value={doctor.userId}>
                                    Dr. {doctor.fullName} · {doctor.specialization}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        Specialization Required <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        value={form.specialization}
                        onChange={(event) => update('specialization', event.target.value)}
                        placeholder="e.g. Cardiology / Neurology"
                        className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                </div>
                
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        Clinical Priority <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={form.priority}
                        onChange={(event) => update('priority', event.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs cursor-pointer"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent / Emergency Escalation</option>
                    </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        Preferred Appointment Date
                    </label>
                    <input
                        type="datetime-local"
                        value={form.appointmentDate}
                        onChange={(event) => update('appointmentDate', event.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                </div>
                
                <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        Clinical Referral Reason &amp; Diagnosis Summary <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                        required
                        value={form.reason}
                        onChange={(event) => update('reason', event.target.value)}
                        rows="3"
                        placeholder="Detailed clinical history, suspected condition, diagnostic findings, and urgency rationale..."
                        className="w-full px-4 py-2.5 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs resize-none"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                </div>
                
                <div className="md:col-span-2 flex justify-end gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                        type="submit"
                        disabled={saving || !patients.length}
                        className="px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        style={{ background: 'var(--accent)' }}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Create &amp; Dispatch Referral</span>
                    </button>
                </div>
            </form>
            {!patients.length && (
                <p 
                    className="mt-4 p-3 text-xs font-bold rounded-2xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                >
                    Note: You must have seen a patient or have one in your queue to create a direct referral.
                </p>
            )}
        </section>
    );
};

export default DoctorReferralForm;