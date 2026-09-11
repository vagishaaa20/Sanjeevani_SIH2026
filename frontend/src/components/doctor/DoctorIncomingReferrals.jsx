import React, { useEffect, useState } from 'react';
import { Check, XCircle, Stethoscope, FileText, RefreshCw, AlertCircle, Clock, User, ArrowUpRight } from 'lucide-react';
import doctorService from '../../services/doctorService';
import Badge from '../common/Badge';

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
        <div className="w-full flex flex-col gap-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-[#2d2329] font-heading flex items-center gap-2">
                        <span>Incoming Community Referrals</span>
                        {referrals.filter(r => r.status === 'SENT').length > 0 && (
                            <span className="bg-[#e13b68] text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                                {referrals.filter(r => r.status === 'SENT').length} New
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-[#7d6974] font-medium mt-0.5">
                        Review and manage patients referred directly to your clinical practice by ASHA & ANM frontline workers.
                    </p>
                </div>
                <button
                    onClick={loadReferrals}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#f5e4ec] rounded-full text-xs font-bold text-[#7d6974] hover:bg-[#ffe6ee] hover:text-[#e13b68] transition shadow-2xs self-start"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin text-[#e13b68]' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {actionError && (
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{actionError}</span>
                </div>
            )}

            <div className="bg-white border border-[#f5e4ec] rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                        <thead className="bg-[#fffcfd] border-b border-[#f5e4ec]">
                            <tr>
                                <th className="px-5 py-3.5 text-left font-bold text-[#7d6974] uppercase tracking-wider text-[11px]">Date</th>
                                <th className="px-5 py-3.5 text-left font-bold text-[#7d6974] uppercase tracking-wider text-[11px]">Patient</th>
                                <th className="px-5 py-3.5 text-left font-bold text-[#7d6974] uppercase tracking-wider text-[11px]">Referred By</th>
                                <th className="px-5 py-3.5 text-left font-bold text-[#7d6974] uppercase tracking-wider text-[11px]">Priority</th>
                                <th className="px-5 py-3.5 text-left font-bold text-[#7d6974] uppercase tracking-wider text-[11px]">Clinical Reason</th>
                                <th className="px-5 py-3.5 text-left font-bold text-[#7d6974] uppercase tracking-wider text-[11px]">Status</th>
                                <th className="px-5 py-3.5 text-left font-bold text-[#7d6974] uppercase tracking-wider text-[11px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5e4ec]">
                            {referrals.map((item) => {
                                const patientName = item.patient?.patientProfile?.fullName || item.patient?.fullName || 'Patient';
                                const referrerName = item.referringHealthWorker?.healthWorkerProfile?.name || 
                                                     item.fromClinic?.clinicProfile?.clinicName || 
                                                     'Community Worker';

                                return (
                                    <tr key={item.id} className="hover:bg-[#fffcfd] transition">
                                        <td className="px-5 py-4 text-[#7d6974] font-medium whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 font-bold text-[#2d2329]">
                                            {patientName}
                                        </td>
                                        <td className="px-5 py-4 text-[#7d6974] font-medium">
                                            {referrerName}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                item.priority === 'URGENT'
                                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                    : item.priority === 'HIGH'
                                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                            }`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-[#4a3c45] max-w-[220px] truncate font-medium" title={item.reason}>
                                            {item.reason}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <Badge variant={item.status === 'SENT' ? 'peach' : item.status === 'ACCEPTED' ? 'mint' : 'sky'}>
                                                    {item.status}
                                                </Badge>
                                                {isOverdue(item) && (
                                                    <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                                        Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {item.status === 'SENT' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(item.id, 'ACCEPTED')}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-full border border-emerald-200 text-xs transition"
                                                        >
                                                            <Check size={12} /> Accept
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(item.id, 'REJECTED')}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-full border border-rose-200 text-xs transition"
                                                        >
                                                            <XCircle size={12} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {item.status === 'ACCEPTED' && (
                                                    <button
                                                        onClick={() => updateStatus(item.id, 'ATTENDED')}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-full border border-sky-200 text-xs transition"
                                                    >
                                                        <Stethoscope size={12} /> Attended
                                                    </button>
                                                )}
                                                {item.status === 'ATTENDED' && (
                                                    <button
                                                        onClick={() => { setSelectedReferral(item); setShowOutcomeModal(true); }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#ffe6ee] text-[#8e1d41] hover:bg-[#f5c6d6] font-bold rounded-full border border-[#f5c6d6] text-xs transition"
                                                    >
                                                        <FileText size={12} /> Record Outcome
                                                    </button>
                                                )}
                                                {item.status === 'OUTCOME_RECORDED' && (
                                                    <button
                                                        onClick={() => updateStatus(item.id, 'CLOSED')}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 font-bold rounded-full border border-zinc-200 text-xs transition"
                                                    >
                                                        <Check size={12} /> Close
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!referrals.length && !loading && (
                    <div className="p-12 text-center text-[#7d6974] font-semibold text-xs flex flex-col items-center justify-center gap-2">
                        <FileText className="w-6 h-6 text-[#e13b68]" />
                        <span>No incoming community referrals at this time.</span>
                    </div>
                )}
            </div>

            {/* Outcome Modal */}
            {showOutcomeModal && selectedReferral && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl border border-[#f5e4ec] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-5">
                        <div className="flex justify-between items-center border-b border-[#f5e4ec] pb-3">
                            <h3 className="text-lg font-black text-[#2d2329] font-heading">Record Clinical Outcome</h3>
                            <button
                                onClick={() => { setShowOutcomeModal(false); setOutcomeText(''); }}
                                className="p-1.5 rounded-lg text-[#7d6974] hover:bg-zinc-100 transition"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleRecordOutcome} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">Outcome Details *</label>
                                <textarea 
                                    className="border border-[#f5e4ec] rounded-2xl p-3 text-xs font-medium outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] resize-none h-32"
                                    placeholder="Enter treatment provided, diagnosis, medication prescribed, or further advice..."
                                    value={outcomeText} 
                                    onChange={e => setOutcomeText(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f5e4ec]">
                                <button
                                    type="button"
                                    onClick={() => { setShowOutcomeModal(false); setOutcomeText(''); }}
                                    className="px-4 py-2 text-xs font-bold text-[#7d6974] hover:bg-zinc-100 rounded-full transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold rounded-full shadow-xs transition"
                                >
                                    Save & Record Outcome
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorIncomingReferrals;
