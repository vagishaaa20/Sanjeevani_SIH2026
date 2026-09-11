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
                Eligible & Enrolled
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
                <label htmlFor="income-bracket" className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                    Annual Household Income Bracket <span className="text-rose-500">*</span>
                </label>
                <select
                    id="income-bracket"
                    value={incomeBracket}
                    onChange={(e) => setIncomeBracket(e.target.value)}
                    className="w-full text-xs md:text-sm border border-[#f5e4ec] bg-white rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 font-medium text-[#2d2329]"
                    required
                >
                    <option value="">Select your household annual income range…</option>
                    {Object.entries(INCOME_BRACKET_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="pincode" className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
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
                    className="w-full text-xs md:text-sm border border-[#f5e4ec] bg-white rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 font-medium text-[#2d2329]"
                    required
                />
                <p className="text-[11px] text-[#7d6974] font-medium mt-0.5">
                    Patients residing in designated underserved or rural blocks automatically receive an additional 10% coverage benefit.
                </p>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="id-proof" className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                    Income Certificate / Ration / BPL Card Proof <span className="font-normal normal-case text-[#7d6974]">(Optional)</span>
                </label>
                <input
                    id="id-proof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setIdProofUrl(file.name);
                    }}
                    className="w-full text-xs text-[#7d6974] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#ffe6ee] file:text-[#8e1d41] hover:file:bg-[#f5c6d6]"
                />
            </div>

            {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-[#f5e4ec]">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-xs font-bold bg-[#e13b68] hover:bg-[#c92a55] text-white rounded-full transition shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{submitting ? 'Submitting Application…' : 'Submit Subsidy Application'}</span>
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2.5 text-xs font-bold border border-[#f5e4ec] bg-white hover:bg-zinc-50 text-[#7d6974] rounded-full transition"
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
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#e13b68] bg-[#ffe6ee] px-2.5 py-0.5 rounded-full">
                            Ayushman & State Healthcare Aid
                        </span>
                        <Badge variant="mint" dot>
                            Verified Benefit
                        </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        Healthcare Subsidy & Assistance
                    </h1>
                    <p className="text-xs font-semibold text-[#7d6974] mt-1">
                        Check your income-based medical fee waiver, medicine discounts, and total platform savings.
                    </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center font-bold flex-shrink-0">
                    <HeartHandshake className="w-6 h-6" />
                </div>
            </div>

            {/* Scheme Highlights Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center mb-1">
                        <Percent className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-[#2d2329]">Up to 70% Fee Coverage</span>
                    <span className="text-xs text-[#7d6974] font-medium leading-relaxed">
                        Automatic reduction on doctor teleconsultation and clinic OPD visit charges.
                    </span>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-[#2d2329]">100% Free Generic Meds</span>
                    <span className="text-xs text-[#7d6974] font-medium leading-relaxed">
                        Full subsidy on essential medications when dispensed at registered Sanjeevani clinics.
                    </span>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1.5">
                    <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-[#2d2329]">Instant ABDM Sync</span>
                    <span className="text-xs text-[#7d6974] font-medium leading-relaxed">
                        Directly linked with your ABHA digital health card for seamless claim processing.
                    </span>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-12 text-center text-[#7d6974] text-xs font-bold flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 text-[#e13b68] animate-spin" />
                    <span>Loading subsidy and eligibility details…</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-white border border-rose-200 rounded-3xl p-6 text-center text-rose-600 text-xs font-bold">
                    {error}
                </div>
            )}

            {/* Enrolled View */}
            {!loading && !error && data?.enrolled && (
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#fdf0f4] pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-[#2d2329] font-heading">Active Subsidy Enrollment</h3>
                                <p className="text-xs text-[#7d6974] font-medium">Your account is active for government medical assistance.</p>
                            </div>
                        </div>
                        <EligibilityBadge status={data.status} enrolled={data.enrolled} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#fffcfd] border border-[#f5e4ec] rounded-2xl p-4 flex flex-col gap-1">
                            <span className="text-xs text-[#7d6974] font-bold uppercase tracking-wider">Subsidy Coverage</span>
                            <span className="text-2xl md:text-3xl font-black text-[#e13b68] font-heading">
                                {data.subsidyPercent}%
                            </span>
                            <span className="text-[11px] text-[#7d6974]">Applied automatically at checkout</span>
                        </div>

                        <div className="bg-[#fffcfd] border border-[#f5e4ec] rounded-2xl p-4 flex flex-col gap-1">
                            <span className="text-xs text-[#7d6974] font-bold uppercase tracking-wider">Total Amount Saved</span>
                            <span className="text-2xl md:text-3xl font-black text-emerald-600 font-heading">
                                ₹{Number(data.totalSaved || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-[11px] text-[#7d6974]">Saved across consultations & meds</span>
                        </div>

                        {data.application?.incomeBracket && (
                            <div className="bg-[#fffcfd] border border-[#f5e4ec] rounded-2xl p-4 flex flex-col gap-1">
                                <span className="text-xs text-[#7d6974] font-bold uppercase tracking-wider">Registered Income Bracket</span>
                                <span className="text-sm font-bold text-[#2d2329] mt-1">
                                    {INCOME_BRACKET_LABELS[data.application.incomeBracket] || data.application.incomeBracket}
                                </span>
                                <span className="text-[11px] text-[#7d6974]">Pincode: {data.application.pincode || 'Verified'}</span>
                            </div>
                        )}
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fffcfd] border border-[#f5e4ec] text-xs text-[#7d6974] font-medium leading-relaxed">
                        Subsidy benefits are automatically deducted when you book a teleconsultation or purchase prescribed medicines from partner network clinics.
                    </div>
                </div>
            )}

            {/* Pending Review View */}
            {!loading && !error && !data?.enrolled && data?.status === 'pending' && (
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#fdf0f4] pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-[#2d2329] font-heading">Application Under Review</h3>
                                <p className="text-xs text-[#7d6974] font-medium">Our verification desk is currently processing your subsidy eligibility documents.</p>
                            </div>
                        </div>
                        <EligibilityBadge status="pending" enrolled={false} />
                    </div>
                    <p className="text-xs text-[#4a3c45] font-medium leading-relaxed">
                        Your subsidy application has been submitted and is undergoing automated cross-verification with regional health authority databases. This typically takes 24 hours.
                    </p>
                </div>
            )}

            {/* Not Enrolled / Application Drawer View */}
            {!loading && !error && !data?.enrolled && data?.status !== 'pending' && (
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#fdf0f4] pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                                <HeartHandshake className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-[#2d2329] font-heading">Subsidy Eligibility & Application</h3>
                                <p className="text-xs text-[#7d6974] font-medium">Apply for government and Sanjeevani health subsidy coverage.</p>
                            </div>
                        </div>
                        {data?.status === 'rejected' && (
                            <EligibilityBadge status="rejected" enrolled={false} />
                        )}
                    </div>

                    {!showForm ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-xs md:text-sm text-[#4a3c45] font-medium leading-relaxed max-w-2xl">
                                You are not currently enrolled in the Sanjeevani healthcare subsidy program. Apply below in under 2 minutes to check your eligibility based on annual household income and locality pincode.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="self-start px-6 py-3 text-xs font-bold bg-[#e13b68] hover:bg-[#c92a55] text-white rounded-full transition shadow-xs flex items-center gap-2 cursor-pointer"
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
