import React, { useEffect, useState } from 'react';
import subsidyService from '../../services/subsidyService';
import {
    IndianRupee,
    ShieldCheck,
    Percent,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    ArrowRight,
    Sparkles,
    Building2,
    HeartHandshake,
    Loader2
} from 'lucide-react';
import Badge from '../../components/common/Badge';

const INCOME_BRACKET_LABELS = {
    below_1lpa: 'Below ₹1 Lakh/year (High Subsidy)',
    '1_3lpa': '₹1 – 3 Lakh/year (Moderate Subsidy)',
    '3_5lpa': '₹3 – 5 Lakh/year (Standard Subsidy)',
    above_5lpa: 'Above ₹5 Lakh/year (Base Support)',
};

// Clean Status Badge without emojis
function EligibilityBadge({ status, enrolled }) {
    if (enrolled) {
        return (
            <Badge variant="mint" dot>
                Eligible &amp; Enrolled
            </Badge>
        );
    }
    if (status === 'pending') {
        return (
            <Badge variant="peach" pulse>
                Application Under Review
            </Badge>
        );
    }
    if (status === 'rejected') {
        return (
            <Badge variant="pink">
                Not Eligible
            </Badge>
        );
    }
    return (
        <Badge variant="muted">
            Not Enrolled
        </Badge>
    );
}

function ApplyForm({ onSuccess, onCancel }) {
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
            <div className="flex flex-col gap-1.5">
                <label htmlFor="income-bracket" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Annual Household Income Bracket <span className="text-rose-500">*</span>
                </label>
                <select
                    id="income-bracket"
                    value={incomeBracket}
                    onChange={(e) => setIncomeBracket(e.target.value)}
                    className="w-full text-xs md:text-sm rounded-2xl p-3 focus:outline-none focus:ring-2 font-medium transition"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    required
                >
                    <option value="">Select your household annual income range…</option>
                    {Object.entries(INCOME_BRACKET_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="pincode" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Residential Area Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 831001"
                    className="w-full text-xs md:text-sm rounded-2xl p-3 focus:outline-none focus:ring-2 font-medium transition"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    required
                />
                <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Patients residing in designated underserved or rural blocks automatically receive an additional 10% coverage benefit.
                </p>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="id-proof" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Income Certificate / Ration / BPL Card Proof <span className="font-normal normal-case opacity-70">(Optional)</span>
                </label>
                <input
                    id="id-proof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setIdProofUrl(file.name);
                    }}
                    className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold transition"
                    style={{ color: 'var(--text-secondary)', '--tw-file-bg': 'var(--accent-light)', '--tw-file-text': 'var(--accent)' }}
                />
            </div>

            {error && (
                <div
                    className="p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2"
                    style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-xs font-bold rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-2 text-white"
                    style={{ background: 'var(--accent)' }}
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{submitting ? 'Submitting Application…' : 'Submit Subsidy Application'}</span>
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2.5 text-xs font-bold rounded-full transition cursor-pointer"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

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
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up pb-12">
            {/* Header Title */}
            <div
                className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            Ayushman &amp; State Healthcare Aid
                        </span>
                        <Badge variant="mint" dot>
                            Verified Benefit
                        </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        Healthcare Subsidy &amp; Assistance
                    </h1>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Check your income-based medical fee waiver, medicine discounts, and total platform savings.
                    </p>
                </div>

                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--notif-unread-border)' }}
                >
                    <HeartHandshake className="w-6 h-6" />
                </div>
            </div>

            {/* Scheme Highlights Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1.5"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center mb-1"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                        <Percent className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Up to 70% Fee Coverage</span>
                    <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Automatic reduction on doctor teleconsultation and clinic OPD visit charges.
                    </span>
                </div>

                <div
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1.5"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center mb-1"
                        style={{ background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)' }}
                    >
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>100% Free Generic Meds</span>
                    <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Full subsidy on essential medications when dispensed at registered Sanjeevani clinics.
                    </span>
                </div>

                <div
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1.5"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center mb-1"
                        style={{ background: 'var(--pastel-sky-bg)', color: 'var(--pastel-sky-text)' }}
                    >
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Instant ABDM Sync</span>
                    <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Directly linked with your ABHA digital health card for seamless claim processing.
                    </span>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div
                    className="rounded-3xl p-12 text-center text-xs font-bold flex flex-col items-center justify-center gap-3"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
                    <span>Loading subsidy and eligibility details…</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div
                    className="border rounded-3xl p-6 text-center text-xs font-bold"
                    style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                >
                    {error}
                </div>
            )}

            {/* Enrolled View */}
            {!loading && !error && data?.enrolled && (
                <div
                    className="rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                style={{ background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)' }}
                            >
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black font-heading" style={{ color: 'var(--text-primary)' }}>Active Subsidy Enrollment</h3>
                                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Your account is active for government medical assistance.</p>
                            </div>
                        </div>
                        <EligibilityBadge status={data.status} enrolled={data.enrolled} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div
                            className="rounded-2xl p-4 flex flex-col gap-1"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Subsidy Coverage</span>
                            <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--accent)' }}>
                                {data.subsidyPercent}%
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Applied automatically at checkout</span>
                        </div>

                        <div
                            className="rounded-2xl p-4 flex flex-col gap-1"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Amount Saved</span>
                            <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--pastel-mint-text)' }}>
                                ₹{Number(data.totalSaved || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Saved across consultations &amp; meds</span>
                        </div>

                        {data.application?.incomeBracket && (
                            <div
                                className="rounded-2xl p-4 flex flex-col gap-1"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Registered Income Bracket</span>
                                <span className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                                    {INCOME_BRACKET_LABELS[data.application.incomeBracket] || data.application.incomeBracket}
                                </span>
                                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Pincode: {data.application.pincode || 'Verified'}</span>
                            </div>
                        )}
                    </div>

                    <div
                        className="p-4 rounded-2xl text-xs font-medium leading-relaxed"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                        Subsidy benefits are automatically deducted when you book a teleconsultation or purchase prescribed medicines from partner network clinics.
                    </div>
                </div>
            )}

            {/* Pending Review View */}
            {!loading && !error && !data?.enrolled && data?.status === 'pending' && (
                <div
                    className="rounded-3xl p-6 md:p-8 flex flex-col gap-4 shadow-xs"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                style={{ background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)' }}
                            >
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black font-heading" style={{ color: 'var(--text-primary)' }}>Application Under Review</h3>
                                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Our verification desk is currently processing your subsidy eligibility documents.</p>
                            </div>
                        </div>
                        <EligibilityBadge status="pending" enrolled={false} />
                    </div>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        Your subsidy application has been submitted and is undergoing automated cross-verification with regional health authority databases. This typically takes 24 hours.
                    </p>
                </div>
            )}

            {/* Not Enrolled / Application Drawer View */}
            {!loading && !error && !data?.enrolled && data?.status !== 'pending' && (
                <div
                    className="rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                            >
                                <HeartHandshake className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black font-heading" style={{ color: 'var(--text-primary)' }}>Subsidy Eligibility &amp; Application</h3>
                                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Apply for government and Sanjeevani health subsidy coverage.</p>
                            </div>
                        </div>
                        {data?.status === 'rejected' && (
                            <EligibilityBadge status="rejected" enrolled={false} />
                        )}
                    </div>

                    {!showForm ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-xs md:text-sm font-medium leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                                You are not currently enrolled in the Sanjeevani healthcare subsidy program. Apply below in under 2 minutes to check your eligibility based on annual household income and locality pincode.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="self-start px-6 py-3 text-xs font-bold rounded-full transition shadow-xs flex items-center gap-2 cursor-pointer text-white"
                                style={{ background: 'var(--accent)' }}
                            >
                                <span>Apply for Healthcare Subsidy</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <ApplyForm onSuccess={handleApplySuccess} onCancel={() => setShowForm(false)} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
