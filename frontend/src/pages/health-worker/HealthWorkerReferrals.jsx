import { useEffect, useState } from 'react';
import { RefreshCcw, Plus, X } from 'lucide-react';
import healthWorkerService from '../../services/healthWorkerService';
import clinicService from '../../services/clinicService';
import api from '../../services/api';

const HealthWorkerReferrals = () => {
    const [referrals, setReferrals] = useState([]);
    const [patients, setPatients] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Create Modal state
    const [showCreate, setShowCreate] = useState(false);
    const [destType, setDestType] = useState('clinic');
    const [formData, setFormData] = useState({ patientId: '', toClinicId: '', toDoctorId: '', reason: '', priority: 'NORMAL' });
    const [createError, setCreateError] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [refRes, patRes, clinicRes, docRes] = await Promise.all([
                healthWorkerService.getReferrals().catch(() => ({ referrals: [] })),
                healthWorkerService.getPatients().catch(() => ({ patients: [] })),
                clinicService.getAllClinics().catch(() => ({ clinics: [] })),
                api.get('/doctors').catch(() => ({ data: { doctors: [] } }))
            ]);
            setReferrals(refRes.referrals || []);
            setPatients(patRes.patients || []);
            setClinics(clinicRes.clinics || []);
            setDoctors(docRes.data?.doctors || []);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateError('');
        if (!formData.patientId || !formData.reason) {
            return setCreateError('Please fill in all required fields');
        }
        if (destType === 'clinic' && !formData.toClinicId) return setCreateError('Please select a receiving clinic');
        if (destType === 'doctor' && !formData.toDoctorId) return setCreateError('Please select a receiving doctor');
        
        try {
            const payload = { ...formData };
            if (destType === 'clinic') payload.toDoctorId = null;
            if (destType === 'doctor') payload.toClinicId = null;

            await healthWorkerService.createReferral(payload);
            setShowCreate(false);
            setFormData({ patientId: '', toClinicId: '', toDoctorId: '', reason: '', priority: 'NORMAL' });
            loadData();
        } catch (err) {
            setCreateError(err.response?.data?.error || 'Failed to create referral');
        }
    };

    const cancelReferral = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this referral?')) return;
        try {
            await healthWorkerService.updateReferral(id, 'CANCELLED');
            loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cancel referral');
        }
    };

    const isOverdue = (referral) => {
        if (['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'].includes(referral.status)) return false;
        const diff = Date.now() - new Date(referral.createdAt).getTime();
        return diff > 48 * 60 * 60 * 1000;
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-800">Referrals Tracking</h2>
                    <p className="text-sm font-semibold text-slate-500">Track and manage referrals for your assigned patients.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadData} className="px-3 py-2 bg-white border-2 border-black rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2 font-semibold">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-emerald-500 text-white border-2 border-black rounded-lg hover:bg-emerald-600 shadow-sm flex items-center gap-2 font-bold">
                        <Plus size={16} /> New Referral
                    </button>
                </div>
            </div>

            {error && <div className="p-3 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 font-bold">{error}</div>}

            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Patient</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Destination</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Reason</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Priority</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Status</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Outcome</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {referrals.map((item) => {
                            const overdue = isOverdue(item);
                            return (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold">{item.patient?.patientProfile?.fullName || 'Unknown'}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.toClinicId ? (
                                            <span className="flex items-center gap-1"><span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-bold">CLINIC</span> {item.toClinic?.clinicProfile?.clinicName || 'Unknown'}</span>
                                        ) : item.toDoctorId ? (
                                            <span className="flex items-center gap-1"><span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">DOCTOR</span> Dr. {item.toDoctor?.doctorProfile?.fullName || 'Unknown'}</span>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={item.reason}>{item.reason}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.priority === 'URGENT' ? 'bg-red-100 text-red-700' : item.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {item.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-bold text-slate-800">{item.status}</span>
                                            {overdue && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded font-bold uppercase tracking-wider">Overdue</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px] truncate" title={item.outcome}>
                                        {item.outcome ? item.outcome : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(item.status === 'PENDING' || item.status === 'SENT') && (
                                            <button onClick={() => cancelReferral(item.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!referrals.length && !loading && (
                    <div className="p-12 text-center text-slate-500 font-semibold">No referrals found. Create one to get started.</div>
                )}
                {loading && !referrals.length && (
                    <div className="p-12 text-center text-slate-500 font-semibold animate-pulse">Loading referrals...</div>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border-2 border-black p-6 w-full max-w-md shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-xl font-black">Create Referral</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>
                        
                        {createError && <div className="p-2 rounded bg-red-50 text-red-700 text-sm font-bold border border-red-200">{createError}</div>}
                        
                        <form onSubmit={handleCreate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700">Patient *</label>
                                <select 
                                    className="border-2 border-slate-300 rounded-lg p-2 font-semibold outline-none focus:border-emerald-500"
                                    value={formData.patientId} 
                                    onChange={e => setFormData({...formData, patientId: e.target.value})}
                                    required
                                >
                                    <option value="">Select a patient...</option>
                                    {patients.map(p => (
                                        <option key={p.patientId} value={p.patientId}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700">Destination Type</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setDestType('clinic'); setFormData({...formData, toDoctorId: ''}); }} className={`flex-1 py-2 rounded-lg border-2 font-bold text-sm ${destType === 'clinic' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Clinic</button>
                                    <button type="button" onClick={() => { setDestType('doctor'); setFormData({...formData, toClinicId: ''}); }} className={`flex-1 py-2 rounded-lg border-2 font-bold text-sm ${destType === 'doctor' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Doctor</button>
                                </div>
                            </div>

                            {destType === 'clinic' ? (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-slate-700">Receiving Clinic *</label>
                                    <select 
                                        className="border-2 border-slate-300 rounded-lg p-2 font-semibold outline-none focus:border-emerald-500"
                                        value={formData.toClinicId} 
                                        onChange={e => setFormData({...formData, toClinicId: e.target.value})}
                                        required={destType === 'clinic'}
                                    >
                                        <option value="">Select a clinic...</option>
                                        {clinics.map(c => (
                                            <option key={c.userId} value={c.userId}>{c.clinicName} - {c.city}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-slate-700">Receiving Doctor *</label>
                                    <select 
                                        className="border-2 border-slate-300 rounded-lg p-2 font-semibold outline-none focus:border-emerald-500"
                                        value={formData.toDoctorId} 
                                        onChange={e => setFormData({...formData, toDoctorId: e.target.value})}
                                        required={destType === 'doctor'}
                                    >
                                        <option value="">Select a doctor...</option>
                                        {doctors.map(d => (
                                            <option key={d.userId} value={d.userId}>Dr. {d.fullName} - {d.specialization}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700">Priority</label>
                                <select 
                                    className="border-2 border-slate-300 rounded-lg p-2 font-semibold outline-none focus:border-emerald-500"
                                    value={formData.priority} 
                                    onChange={e => setFormData({...formData, priority: e.target.value})}
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700">Reason / Clinical Notes *</label>
                                <textarea 
                                    className="border-2 border-slate-300 rounded-lg p-2 font-semibold outline-none focus:border-emerald-500 resize-none h-24"
                                    placeholder="Describe the reason for referral..."
                                    value={formData.reason} 
                                    onChange={e => setFormData({...formData, reason: e.target.value})}
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg border-2 border-black shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">Send Referral</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthWorkerReferrals;