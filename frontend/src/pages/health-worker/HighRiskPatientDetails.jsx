import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import highRiskService from '../../services/highRiskService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { ShieldAlert, AlertTriangle, User as UserIcon, Calendar, Activity, CheckCircle, ArrowRight, HeartPulse } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { NotificationContext } from '../../context/NotificationContext';

const HighRiskPatientDetails = () => {
    const { patientId } = useParams();
    const { addNotification } = useContext(NotificationContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Escalation Modal state
    const [showEscalationModal, setShowEscalationModal] = useState(false);
    const [escalationReason, setEscalationReason] = useState('');
    // Dummy Doctor ID for MVP, or we would fetch available doctors. 
    // In actual implementation, we might just use a dropdown or assign automatically. 
    // For now we'll simulate a doctor ID or expect the backend to handle it, but the prompt says 
    // "escalate to a doctor" so we might need a doctorId. 
    // To keep it minimal, let's hardcode a known doctor ID or leave it blank and let backend handle if needed,
    // wait, the backend controller requires `doctorId`.
    // The requirement says: "A Health Worker should be able to escalate a high-risk patient to the doctor/clinic when necessary."
    // Let's fetch a doctor list, or just use the first available doctor from healthWorkerService.
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');

    useEffect(() => {
        loadData();
        // Load doctors for escalation
        fetch('http://localhost:5000/api/doctors') // Using generic list if available, or just mock
            .then(r => r.json())
            .then(d => {
                if(d.doctors && d.doctors.length > 0) {
                    setDoctors(d.doctors);
                    setSelectedDoctorId(d.doctors[0].userId);
                }
            }).catch(console.error);
    }, [patientId]);

    const loadData = () => {
        setLoading(true);
        highRiskService.getPatientDetails(patientId)
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load patient details');
                setLoading(false);
            });
    };

    const handleEscalate = async (e) => {
        e.preventDefault();
        try {
            await highRiskService.escalatePatient(patientId, { doctorId: selectedDoctorId, escalationReason });
            addNotification('success', 'Patient escalated successfully.');
            setShowEscalationModal(false);
            loadData();
        } catch (err) {
            addNotification('error', err.response?.data?.error || 'Failed to escalate');
        }
    };

    const handleResolve = async () => {
        if(!window.confirm("Are you sure you want to resolve this high-risk episode?")) return;
        try {
            await highRiskService.updateStatus(patientId, 'RESOLVED');
            addNotification('success', 'Episode marked as resolved.');
            loadData();
        } catch (err) {
            addNotification('error', err.response?.data?.error || 'Failed to update status');
        }
    };

    if (loading) return <div className="p-8 text-center text-[#7d6974] font-bold animate-pulse">Loading Details...</div>;
    if (error) return <div className="p-8 text-center text-rose-700 font-bold">{error}</div>;
    if (!data || !data.highRiskRecord) return <div className="p-8 text-center text-[#7d6974] font-bold">Record not found.</div>;

    const { highRiskRecord, followups, referrals, diagnostics } = data;
    const profile = highRiskRecord.patientProfile;
    const isOverdue = highRiskRecord.nextFollowupAt && new Date(highRiskRecord.nextFollowupAt) < new Date(new Date().setHours(0,0,0,0));

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up pb-12">
            <div className="flex justify-between items-center">
                <PageHeader 
                    title="Patient High-Risk Details" 
                    subtitle="Monitor care timeline and actions."
                    icon={ShieldAlert}
                />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
                    {highRiskRecord.status !== 'RESOLVED' && (
                        <Button variant="outline" onClick={handleResolve}>Mark Resolved</Button>
                    )}
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-cream-card border border-[#f5e4ec] rounded-3xl p-6 shadow-xs">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#fdf5f7] flex items-center justify-center text-[#e13b68]">
                            <UserIcon className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-[#2d2329]">{profile?.fullName || 'Unknown Patient'}</h2>
                            <div className="flex gap-4 mt-2">
                                <span className="text-sm font-semibold text-[#7d6974]">Risk Level: <strong className="text-[#e13b68]">{highRiskRecord.riskLevel}</strong></span>
                                <span className="text-sm font-semibold text-[#7d6974]">Status: <Badge variant="lavender">{highRiskRecord.status}</Badge></span>
                            </div>
                            <p className="mt-3 text-sm text-[#7d6974]">
                                <strong>Reason:</strong> {highRiskRecord.riskReason || 'Not specified'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="bg-[#fdf5f7] border border-[#f8e7ee] p-3 rounded-2xl flex flex-col">
                            <span className="text-[10px] uppercase font-black text-[#e13b68]">Next Follow-up</span>
                            <span className="text-sm font-bold text-[#2d2329]">
                                {highRiskRecord.nextFollowupAt ? new Date(highRiskRecord.nextFollowupAt).toLocaleDateString() : 'None Scheduled'}
                            </span>
                            {isOverdue && highRiskRecord.status !== 'RESOLVED' && <Badge variant="pink" className="mt-1 self-start">OVERDUE</Badge>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-[#f5e4ec] overflow-x-auto">
                    <Link to="/health-worker/followups">
                        <Button variant="primary">Record Follow-up</Button>
                    </Link>
                    <Link to="/health-worker/referrals">
                        <Button variant="outline">Create Referral</Button>
                    </Link>
                    {highRiskRecord.status !== 'ESCALATED' && highRiskRecord.status !== 'RESOLVED' && (
                        <Button variant="danger" onClick={() => setShowEscalationModal(true)}>Escalate to Doctor</Button>
                    )}
                </div>
            </div>

            {/* Timelines and existing integration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Timeline */}
                <div className="bg-cream-card border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
                    <h3 className="text-base font-black text-[#2d2329] font-heading flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#e13b68]" /> Care Timeline
                    </h3>
                    <div className="flex flex-col gap-4 pl-2 border-l-2 border-[#f8e7ee]">
                        {/* Creation */}
                        <div className="relative pl-4">
                            <div className="absolute w-3 h-3 bg-[#e13b68] rounded-full -left-[23px] top-1 border-2 border-white"></div>
                            <span className="text-[10px] font-bold text-[#7d6974]">{new Date(highRiskRecord.identifiedAt).toLocaleDateString()}</span>
                            <h4 className="text-sm font-bold text-[#2d2329]">AI Triage → {highRiskRecord.riskLevel} RISK</h4>
                        </div>
                        
                        {/* Followups */}
                        {followups.map(f => (
                            <div key={f.id} className="relative pl-4">
                                <div className="absolute w-3 h-3 bg-[#10b981] rounded-full -left-[23px] top-1 border-2 border-white"></div>
                                <span className="text-[10px] font-bold text-[#7d6974]">{new Date(f.followUpDate).toLocaleDateString()}</span>
                                <h4 className="text-sm font-bold text-[#2d2329]">Follow-up {f.status}</h4>
                                {f.notes && <p className="text-xs text-[#7d6974] mt-1 line-clamp-2">{f.notes}</p>}
                            </div>
                        ))}

                        {/* Referrals */}
                        {referrals.map(r => (
                            <div key={r.id} className="relative pl-4">
                                <div className="absolute w-3 h-3 bg-[#7c3aed] rounded-full -left-[23px] top-1 border-2 border-white"></div>
                                <span className="text-[10px] font-bold text-[#7d6974]">{new Date(r.createdAt).toLocaleDateString()}</span>
                                <h4 className="text-sm font-bold text-[#2d2329]">Referral {r.status}</h4>
                                <p className="text-xs text-[#7d6974] mt-1">{r.reason}</p>
                            </div>
                        ))}

                        {/* Escalation */}
                        {highRiskRecord.status === 'ESCALATED' && highRiskRecord.escalationReason && (
                            <div className="relative pl-4">
                                <div className="absolute w-3 h-3 bg-orange-500 rounded-full -left-[23px] top-1 border-2 border-white"></div>
                                <span className="text-[10px] font-bold text-[#7d6974]">Current Status</span>
                                <h4 className="text-sm font-bold text-orange-600">Escalated to Doctor</h4>
                                <p className="text-xs text-[#7d6974] mt-1">{highRiskRecord.escalationReason}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Integration Summaries */}
                <div className="flex flex-col gap-6">
                    <div className="bg-cream-card border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
                        <h3 className="text-base font-black text-[#2d2329] font-heading flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-[#7c3aed]" /> Referrals
                        </h3>
                        {referrals.length === 0 ? (
                            <p className="text-sm text-[#7d6974]">No active referrals.</p>
                        ) : (
                            referrals.slice(0, 2).map(r => (
                                <div key={r.id} className="p-3 border border-[#f5e4ec] rounded-2xl flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#2d2329]">To {r.toDoctor?.doctorProfile?.fullName || 'Clinic'}</span>
                                        <span className="text-[10px] text-[#7d6974]">{r.reason}</span>
                                    </div>
                                    <Badge variant="lavender">{r.status}</Badge>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="bg-cream-card border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
                        <h3 className="text-base font-black text-[#2d2329] font-heading flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-[#1e7ab8]" /> Diagnostics
                        </h3>
                        {diagnostics.length === 0 ? (
                            <p className="text-sm text-[#7d6974]">No diagnostic requests.</p>
                        ) : (
                            diagnostics.slice(0, 2).map(d => (
                                <div key={d.id} className="p-3 border border-[#f5e4ec] rounded-2xl flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#2d2329]">{d.testName}</span>
                                    </div>
                                    <Badge variant={d.status === 'COMPLETED' ? 'mint' : 'lavender'}>{d.status}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Escalation Modal */}
            {showEscalationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-cream-card rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
                        <h3 className="text-lg font-black text-[#2d2329] flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" /> Escalate to Doctor
                        </h3>
                        <form onSubmit={handleEscalate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-[#2d2329]">Select Doctor</label>
                                <select 
                                    className="p-3 border border-[#f5e4ec] rounded-xl text-sm outline-none focus:border-[#e13b68]"
                                    value={selectedDoctorId}
                                    onChange={e => setSelectedDoctorId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Doctor --</option>
                                    {doctors.map(d => (
                                        <option key={d.userId} value={d.userId}>{d.clinicName || d.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-[#2d2329]">Reason for Escalation</label>
                                <textarea 
                                    className="p-3 border border-[#f5e4ec] rounded-xl text-sm outline-none focus:border-[#e13b68] min-h-[100px]"
                                    placeholder="Symptoms worsening, high fever, etc."
                                    value={escalationReason}
                                    onChange={e => setEscalationReason(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-2">
                                <Button type="button" variant="outline" onClick={() => setShowEscalationModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">Submit Escalation</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HighRiskPatientDetails;
