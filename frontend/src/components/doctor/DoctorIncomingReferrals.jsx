import React, { useEffect, useState } from 'react';
import { Check, XCircle, Stethoscope, FileText, RefreshCw, AlertCircle, Clock, User, ArrowUpRight } from 'lucide-react';
import doctorService from "../../services/doctorService";
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
                    <h2 className="text-xl font-black font-heading flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span>Incoming Community Referrals</span>
                        {referrals.filter(r => r.status === 'SENT').length > 0 && (
                            <span 
                                className="text-white text-xs px-2.5 py-0.5 rounded-full font-bold"
                                style={{ background: 'var(--accent)' }}
                            >
                                {referrals.filter(r => r.status === 'SENT').length} New
                            </span>
                        )}
                    </h2>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Review and manage patients referred directly to your clinical practice by ASHA &amp; ANM frontline workers.
                    </p>
                </div>
                <button
                    onClick={loadReferrals}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition shadow-2xs self-start cursor-pointer hover:opacity-90"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--accent)' }} />
                    <span>Refresh</span>
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {actionError && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>{actionError}</span>
                </div>
            )}

            <div 
                className="rounded-3xl overflow-hidden shadow-xs"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                        <thead style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-secondary)' }}>Date</th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-secondary)' }}>Patient</th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-secondary)' }}>Referred By</th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-secondary)' }}>Priority</th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-secondary)' }}>Clinical Reason</th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-secondary)' }}>Status</th>
                                <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referrals.map((item) => {
                                const patientName = item.patient?.patientProfile?.fullName || item.patient?.fullName || 'Patient';
                                const referrerName = item.referringHealthWorker?.healthWorkerProfile?.name || 
                                                     item.fromClinic?.clinicProfile?.clinicName || 
                                                     'Community Worker';

                                return (
                                    <tr 
                                        key={item.id} 
                                        className="transition hover:opacity-90"
                                        style={{ borderBottom: '1px solid var(--border)' }}
                                    >
                                        <td className="px-5 py-4 font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {patientName}
                                        </td>
                                        <td className="px-5 py-4 font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            {referrerName}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                item.priority === 'URGENT'
                                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                                    : item.priority === 'HIGH'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                            }`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 max-w-[220px] truncate font-medium" style={{ color: 'var(--text-secondary)' }} title={item.reason}>
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
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold rounded-full border border-emerald-500/30 text-xs transition cursor-pointer"
                                                        >
                                                            <Check size={12} /> Accept
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(item.id, 'REJECTED')}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold rounded-full border border-rose-500/30 text-xs transition cursor-pointer"
                                                        >
                                                            <XCircle size={12} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {item.status === 'ACCEPTED' && (
                                                    <button
                                                        onClick={() => updateStatus(item.id, 'ATTENDED')}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 font-bold rounded-full border border-sky-500/30 text-xs transition cursor-pointer"
                                                    >
                                                        <Stethoscope size={12} /> Attended
                                                    </button>
                                                )}
                                                {item.status === 'ATTENDED' && (
                                                    <button
                                                        onClick={() => { setSelectedReferral(item); setShowOutcomeModal(true); }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 font-bold rounded-full text-xs transition cursor-pointer"
                                                        style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                                                    >
                                                        <FileText size={12} /> Record Outcome
                                                    </button>
                                                )}
                                                {item.status === 'OUTCOME_RECORDED' && (
                                                    <button
                                                        onClick={() => updateStatus(item.id, 'CLOSED')}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 font-bold rounded-full text-xs transition cursor-pointer"
                                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
                    <div className="p-12 text-center font-semibold text-xs flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <FileText className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                        <span>No incoming community referrals at this time.</span>
                    </div>
                )}
            </div>

            {/* Outcome Modal */}
            {showOutcomeModal && selectedReferral && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
                    <div 
                        className="rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-5"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                            <h3 className="text-lg font-black font-heading" style={{ color: 'var(--text-primary)' }}>Record Clinical Outcome</h3>
                            <button
                                onClick={() => { setShowOutcomeModal(false); setOutcomeText(''); }}
                                className="p-1.5 rounded-lg transition cursor-pointer hover:opacity-80"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleRecordOutcome} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Outcome Details *</label>
                                <textarea 
                                    className="rounded-2xl p-3 text-xs font-medium outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] resize-none h-32"
                                    placeholder="Enter treatment provided, diagnosis, medication prescribed, or further advice..."
                                    value={outcomeText} 
                                    onChange={e => setOutcomeText(e.target.value)}
                                    required
                                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div className="flex justify-end gap-2.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowOutcomeModal(false); setOutcomeText(''); }}
                                    className="px-4 py-2 text-xs font-bold rounded-full transition cursor-pointer hover:opacity-80"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    Save &amp; Record Outcome
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
