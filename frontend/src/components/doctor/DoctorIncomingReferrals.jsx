import React, { useEffect, useState } from 'react';
import { Check, XCircle, Stethoscope, FileText, RefreshCw } from 'lucide-react';
import doctorService from '../../services/doctorService';
import { differenceInDays } from 'date-fns';

const DoctorIncomingReferrals = () => {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [showOutcomeModal, setShowOutcomeModal] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [outcomeText, setOutcomeText] = useState('');

    const loadReferrals = async () => {
        try {
            setLoading(true);
            const data = await doctorService.getIncomingReferrals();
            setReferrals(data.referrals || []);
            setError('');
        } catch (err) {
            console.error('Failed to load incoming referrals:', err);
            setError('Could not load incoming referrals.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReferrals();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            setActionError('');
            await doctorService.updateIncomingReferral(id, { status });
            await loadReferrals();
        } catch (err) {
            console.error(`Failed to mark referral as ${status}:`, err);
            setActionError(`Failed to mark referral as ${status}.`);
        }
    };

    const handleRecordOutcome = async (e) => {
        e.preventDefault();
        if (!outcomeText.trim()) return;
        try {
            setActionError('');
            await doctorService.updateIncomingReferral(selectedReferral.id, { status: 'OUTCOME_RECORDED', outcome: outcomeText });
            setShowOutcomeModal(false);
            setOutcomeText('');
            await loadReferrals();
        } catch (err) {
            console.error('Failed to record outcome:', err);
            setActionError('Failed to record outcome.');
        }
    };

    const isOverdue = (referral) => {
        if (['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'].includes(referral.status)) return false;
        const diff = Date.now() - new Date(referral.createdAt).getTime();
        return diff > 48 * 60 * 60 * 1000;
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left border-t-2 border-slate-200 pt-8 mt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        Incoming Referrals
                        {referrals.filter(r => r.status === 'SENT').length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {referrals.filter(r => r.status === 'SENT').length} New
                            </span>
                        )}
                    </h2>
                    <p className="text-slate-500 font-semibold text-sm">Review and manage patients referred directly to you.</p>
                </div>
                <button onClick={loadReferrals} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors self-start">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && <div className="p-3 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 font-bold">{error}</div>}
            {actionError && <div className="p-3 rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700 font-bold">{actionError}</div>}

            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Date</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Patient</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Referred By</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Priority</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Reason</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Status</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {referrals.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-semibold">{item.patient?.patientProfile?.fullName || 'Unknown'}</td>
                                <td className="px-4 py-3 text-slate-600">
                                    {item.referringHealthWorker?.healthWorkerProfile?.name || 
                                     item.fromClinic?.clinicProfile?.clinicName || 
                                     'Unknown'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.priority === 'URGENT' ? 'bg-red-100 text-red-700' : item.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {item.priority}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={item.reason}>{item.reason}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-bold text-slate-800">{item.status}</span>
                                        {isOverdue(item) && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded font-bold uppercase tracking-wider">Overdue</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        {item.status === 'SENT' && (
                                            <>
                                                <button onClick={() => updateStatus(item.id, 'ACCEPTED')} className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 font-bold rounded border border-emerald-300 hover:bg-emerald-200 text-xs">
                                                    <Check size={14} /> Accept
                                                </button>
                                                <button onClick={() => updateStatus(item.id, 'REJECTED')} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 font-bold rounded border border-red-300 hover:bg-red-200 text-xs">
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </>
                                        )}
                                        {item.status === 'ACCEPTED' && (
                                            <button onClick={() => updateStatus(item.id, 'ATTENDED')} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 font-bold rounded border border-blue-300 hover:bg-blue-200 text-xs">
                                                <Stethoscope size={14} /> Attended
                                            </button>
                                        )}
                                        {item.status === 'ATTENDED' && (
                                            <button onClick={() => { setSelectedReferral(item); setShowOutcomeModal(true); }} className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 font-bold rounded border border-purple-300 hover:bg-purple-200 text-xs">
                                                <FileText size={14} /> Record Outcome
                                            </button>
                                        )}
                                        {item.status === 'OUTCOME_RECORDED' && (
                                            <button onClick={() => updateStatus(item.id, 'CLOSED')} className="flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 hover:bg-slate-300 text-xs">
                                                <Check size={14} /> Close
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!referrals.length && !loading && (
                    <div className="p-12 text-center text-slate-500 font-semibold">No incoming referrals.</div>
                )}
            </div>

            {/* Outcome Modal */}
            {showOutcomeModal && selectedReferral && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border-2 border-black p-6 w-full max-w-md shadow-xl flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-xl font-black">Record Outcome</h3>
                        </div>
                        <form onSubmit={handleRecordOutcome} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700">Outcome Details *</label>
                                <textarea 
                                    className="border-2 border-slate-300 rounded-lg p-2 font-semibold outline-none focus:border-emerald-500 resize-none h-32"
                                    placeholder="Enter treatment provided, further actions, etc."
                                    value={outcomeText} 
                                    onChange={e => setOutcomeText(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                                <button type="button" onClick={() => { setShowOutcomeModal(false); setOutcomeText(''); }} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg border-2 border-black">Save & Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorIncomingReferrals;
