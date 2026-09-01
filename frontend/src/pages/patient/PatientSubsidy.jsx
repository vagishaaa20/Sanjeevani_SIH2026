import React, { useEffect, useState } from 'react';
import subsidyService from '../../services/subsidyService';

const INCOME_BRACKET_LABELS = {
    below_1lpa: 'Below ₹1 Lakh/year',
    '1_3lpa': '₹1 – 3 Lakh/year',
    '3_5lpa': '₹3 – 5 Lakh/year',
    above_5lpa: 'Above ₹5 Lakh/year',
};

// ── Status badge ───────────────────────────────────────────────────────────────
function EligibilityBadge({ status, enrolled }) {
    if (enrolled) {
        return (
            <span className="px-3 py-1 text-xs font-bold rounded-full border border-emerald-400 bg-emerald-50 text-emerald-700 uppercase">
                ✅ Eligible
            </span>
        );
    }
    if (status === 'pending') {
        return (
            <span className="px-3 py-1 text-xs font-bold rounded-full border border-amber-400 bg-amber-50 text-amber-700 uppercase">
                ⏳ Pending Review
            </span>
        );
    }
    if (status === 'rejected') {
        return (
            <span className="px-3 py-1 text-xs font-bold rounded-full border border-red-400 bg-red-50 text-red-700 uppercase">
                ❌ Not Eligible
            </span>
        );
    }
    return null;
}

// ── Apply form ─────────────────────────────────────────────────────────────────
function ApplyForm({ onSuccess }) {
    const [incomeBracket, setIncomeBracket] = useState('');
    const [pincode, setPincode] = useState('');
    const [idProofUrl, setIdProofUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!incomeBracket || !pincode) {
            setError('Income bracket and pincode are required.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const result = await subsidyService.applySubsidy({ incomeBracket, pincode, idProofUrl: idProofUrl || undefined });
            onSuccess(result);
        } catch (err) {
            setError(err.response?.data?.error || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Income bracket */}
            <div>
                <label htmlFor="income-bracket" className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                    Annual Income Bracket
                </label>
                <select
                    id="income-bracket"
                    value={incomeBracket}
                    onChange={(e) => setIncomeBracket(e.target.value)}
                    className="w-full text-sm border-2 border-zinc-200 rounded-lg p-2.5 focus:outline-none focus:border-cerulean"
                    required
                >
                    <option value="">Select your income range…</option>
                    {Object.entries(INCOME_BRACKET_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Pincode */}
            <div>
                <label htmlFor="pincode" className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                    Pincode
                </label>
                <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 831001"
                    className="w-full text-sm border-2 border-zinc-200 rounded-lg p-2.5 focus:outline-none focus:border-cerulean"
                    required
                />
                <p className="text-[10px] text-ink-muted mt-0.5">
                    Patients in underserved areas receive an additional 10% subsidy.
                </p>
            </div>

            {/* ID proof upload */}
            <div>
                <label htmlFor="id-proof" className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                    ID Proof <span className="font-normal normal-case text-zinc-400">(optional)</span>
                </label>
                <input
                    id="id-proof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                        // For now store the filename as a placeholder — real upload handled by document service
                        const file = e.target.files?.[0];
                        if (file) setIdProofUrl(file.name);
                    }}
                    className="w-full text-sm text-ink-charcoal file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-2 file:border-ink-black file:bg-white file:text-xs file:font-bold hover:file:bg-ink-black hover:file:text-white file:transition-colors"
                />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
                type="submit"
                disabled={submitting}
                className="self-start px-6 py-2.5 text-sm font-bold bg-ink-black text-white rounded-xl hover:bg-cerulean-dark transition-colors disabled:opacity-50"
            >
                {submitting ? 'Submitting…' : 'Apply for Subsidy'}
            </button>
        </form>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PatientSubsidy() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        subsidyService.getMySubsidy()
            .then((result) => setData(result))
            .catch((err) => setError(err.response?.data?.error || 'Could not load subsidy info'))
            .finally(() => setLoading(false));
    }, []);

    const handleApplySuccess = (result) => {
        // Refresh state from the API response
        setData({
            enrolled: result.enrolled,
            status: result.application.status,
            subsidyPercent: result.subsidyPercent,
            totalSaved: data?.totalSaved || 0,
            application: result.application,
        });
        setShowForm(false);
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            {/* Page header */}
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col gap-1 shadow-sm">
                <h2 className="text-3xl font-black text-ink-black">Subsidy &amp; Assistance</h2>
                <p className="text-sm font-semibold text-ink-charcoal">
                    Check your eligibility and savings
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-8 text-center text-ink-charcoal text-sm">
                    Loading subsidy information…
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-white border-2 border-red-300 rounded-2xl p-8 text-center text-red-500 text-sm">
                    {error}
                </div>
            )}

            {/* Enrolled — show status + savings */}
            {!loading && !error && data?.enrolled && (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black text-ink-black">Subsidy Status</h3>
                        <EligibilityBadge status={data.status} enrolled={data.enrolled} />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-pastel-sky-soft border border-cerulean rounded-xl p-4">
                            <p className="text-xs text-cerulean-dark font-bold uppercase tracking-wider">Subsidy</p>
                            <p className="text-3xl font-black text-ink-black mt-1">{data.subsidyPercent}%</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
                            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Total Saved</p>
                            <p className="text-3xl font-black text-ink-black mt-1">
                                ₹{Number(data.totalSaved || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        {data.application?.incomeBracket && (
                            <div className="bg-white border-2 border-zinc-200 rounded-xl p-4">
                                <p className="text-xs text-ink-muted font-bold uppercase tracking-wider">Income Bracket</p>
                                <p className="text-sm font-bold text-ink-black mt-1">
                                    {INCOME_BRACKET_LABELS[data.application.incomeBracket] || data.application.incomeBracket}
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-ink-muted">
                        Subsidy is automatically applied at the time of payment for each consultation.
                    </p>
                </div>
            )}

            {/* Pending review */}
            {!loading && !error && !data?.enrolled && data?.status === 'pending' && (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black text-ink-black">Subsidy Status</h3>
                        <EligibilityBadge status="pending" enrolled={false} />
                    </div>
                    <p className="text-sm text-ink-charcoal">
                        Your application is under review. We'll update your status shortly.
                    </p>
                </div>
            )}

            {/* Not enrolled / rejected — show apply */}
            {!loading && !error && !data?.enrolled && data?.status !== 'pending' && (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black text-ink-black">Subsidy Eligibility</h3>
                        {data?.status === 'rejected' && (
                            <EligibilityBadge status="rejected" enrolled={false} />
                        )}
                    </div>

                    {/* Total saved even without enrolment (may be 0) */}
                    {Number(data?.totalSaved || 0) > 0 && (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
                            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Total Saved</p>
                            <p className="text-3xl font-black text-ink-black mt-1">
                                ₹{Number(data.totalSaved).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}

                    {!showForm ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-ink-charcoal">
                                You are not currently enrolled in the government subsidy scheme. Apply below to check your eligibility based on your income and location.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="self-start px-6 py-2.5 text-sm font-bold bg-ink-black text-white rounded-xl hover:bg-cerulean-dark transition-colors"
                            >
                                Apply for Subsidy →
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h4 className="text-base font-bold text-ink-black mb-4">Subsidy Application</h4>
                            <ApplyForm onSuccess={handleApplySuccess} />
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="mt-3 text-xs text-ink-muted hover:text-ink-black"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
