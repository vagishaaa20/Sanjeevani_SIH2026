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
        <section className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs text-left">
            <div className="mb-6 border-b border-[#f5e4ec] pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e13b68] bg-[#ffe6ee] px-2.5 py-0.5 rounded-full">
                        Referral Poster
                    </span>
                </div>
                <h3 className="text-xl font-black text-[#2d2329] font-heading">Create Patient Referral</h3>
                <p className="text-xs text-[#7d6974] font-medium mt-0.5">
                    Refer patients from your queue or recent consultations to specialized hospitals or doctors.
                </p>
            </div>
            
            {message.text && (
                <div className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
                    message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}
            
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                        Select Patient <span className="text-rose-500">*</span>
                    </label>
                    <select
                        required
                        value={form.patientId}
                        onChange={(event) => update('patientId', event.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-xs font-medium text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs"
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
                    <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                        Destination Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { setDestType('clinic'); update('toDoctorId', ''); }}
                            className={`flex-1 py-2 rounded-2xl text-xs font-bold border transition ${
                                destType === 'clinic'
                                    ? 'bg-[#ffe6ee] text-[#8e1d41] border-[#f5c6d6] shadow-2xs'
                                    : 'bg-white border-[#f5e4ec] text-[#7d6974] hover:bg-zinc-50'
                            }`}
                        >
                            Hospital / Clinic
                        </button>
                        <button
                            type="button"
                            onClick={() => { setDestType('doctor'); update('toClinicId', ''); }}
                            className={`flex-1 py-2 rounded-2xl text-xs font-bold border transition ${
                                destType === 'doctor'
                                    ? 'bg-[#ffe6ee] text-[#8e1d41] border-[#f5c6d6] shadow-2xs'
                                    : 'bg-white border-[#f5e4ec] text-[#7d6974] hover:bg-zinc-50'
                            }`}
                        >
                            Specialist Doctor
                        </button>
                    </div>
                </div>

                {destType === 'clinic' ? (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                            Destination Clinic / Hospital <span className="text-rose-500">*</span>
                        </label>
                        <select
                            required
                            value={form.toClinicId}
                            onChange={(event) => update('toClinicId', event.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-xs font-medium text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs"
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
                        <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                            Destination Doctor <span className="text-rose-500">*</span>
                        </label>
                        <select
                            required
                            value={form.toDoctorId}
                            onChange={(event) => update('toDoctorId', event.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-xs font-medium text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs"
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
                    <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                        Specialization Required <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        value={form.specialization}
                        onChange={(event) => update('specialization', event.target.value)}
                        placeholder="e.g. Cardiology / Neurology"
                        className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-xs font-medium text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs"
                    />
                </div>
                
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                        Clinical Priority <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={form.priority}
                        onChange={(event) => update('priority', event.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-xs font-medium text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs"
                    >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent / Emergency Escalation</option>
                    </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                        Preferred Appointment Date
                    </label>
                    <input
                        type="datetime-local"
                        value={form.appointmentDate}
                        onChange={(event) => update('appointmentDate', event.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-xs font-medium text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs"
                    />
                </div>
                
                <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                        Clinical Referral Reason & Diagnosis Summary <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                        required
                        value={form.reason}
                        onChange={(event) => update('reason', event.target.value)}
                        rows="3"
                        placeholder="Detailed clinical history, suspected condition, diagnostic findings, and urgency rationale..."
                        className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-xs font-medium text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] outline-none shadow-2xs resize-none"
                    />
                </div>
                
                <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-[#f5e4ec]">
                    <button
                        type="submit"
                        disabled={saving || !patients.length}
                        className="px-6 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Create & Dispatch Referral</span>
                    </button>
                </div>
            </form>
            {!patients.length && (
                <p className="mt-4 p-3 bg-[#ffe6ee]/60 border border-[#f5c6d6] text-xs font-bold text-[#8e1d41] rounded-2xl">
                    Note: You must have seen a patient or have one in your queue to create a direct referral.
                </p>
            )}
        </section>
    );
};

export default DoctorReferralForm;