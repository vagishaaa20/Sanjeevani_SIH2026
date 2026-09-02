import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import DoctorOutbreakWidget from '../../components/doctor/DoctorOutbreakWidget';
import DoctorQueueList from '../../components/doctor/DoctorQueueList';

const STATUS_MESSAGES = {
    PENDING_VERIFICATION: {
        emoji: '⏳',
        title: 'Application Under Review',
        subtitle: 'Your account is pending admin verification.',
        detail:
            'Our team has received your registration and will review your submitted documents. This typically takes 1–2 business days. You will be notified once your account is approved.',
        color: 'amber',
    },
    UNDER_REVIEW: {
        emoji: '🔍',
        title: 'Active Document Review',
        subtitle: 'An admin is currently reviewing your credentials.',
        detail:
            'Your documents are being examined by our verification team. Please ensure all required documents are uploaded. You may upload or replace documents while your application is being reviewed.',
        color: 'blue',
    },
    REJECTED: {
        emoji: '✗',
        title: 'Application Rejected',
        subtitle: 'Your verification request was not approved.',
        detail:
            'Your application was rejected. Please check any admin notes, correct the issues, re-upload your documents, and contact support if you believe this is an error.',
        color: 'red',
    },
    SUSPENDED: {
        emoji: '🚫',
        title: 'Account Suspended',
        subtitle: 'Your account has been suspended by an administrator.',
        detail:
            'Please contact Sanjeevani support for further assistance regarding your account status.',
        color: 'red',
    },
};

const colorMap = {
    amber: {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        title: 'text-amber-900',
        sub: 'text-amber-800',
        detail: 'text-amber-700',
        step: 'bg-amber-100 border-amber-300 text-amber-800',
        dot: 'bg-amber-400',
    },
    blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        title: 'text-blue-900',
        sub: 'text-blue-800',
        detail: 'text-blue-700',
        step: 'bg-blue-100 border-blue-300 text-blue-800',
        dot: 'bg-blue-400',
    },
    red: {
        bg: 'bg-red-50',
        border: 'border-red-300',
        title: 'text-red-900',
        sub: 'text-red-800',
        detail: 'text-red-700',
        step: 'bg-red-100 border-red-300 text-red-800',
        dot: 'bg-red-400',
    },
};

const STEPS = [
    { label: 'Register', done: true },
    { label: 'Upload Documents', done: true },
    { label: 'Under Admin Review', active: true },
    { label: 'Verified & Active', done: false },
];

// ── Blocked verification gate ─────────────────────────────────────────────────
const VerificationGate = ({ status }) => {
    const cfg = STATUS_MESSAGES[status] || STATUS_MESSAGES.PENDING_VERIFICATION;
    const colors = colorMap[cfg.color];

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            {/* Hero card */}
            <div className={`rounded-3xl border-2 ${colors.border} ${colors.bg} p-8 shadow-sm flex flex-col gap-4`}>
                <div className="flex items-center gap-4">
                    <span className="text-5xl">{cfg.emoji}</span>
                    <div>
                        <h2 className={`text-2xl font-black ${colors.title} font-heading`}>{cfg.title}</h2>
                        <p className={`text-sm font-bold ${colors.sub} mt-0.5`}>{cfg.subtitle}</p>
                    </div>
                </div>
                <p className={`text-sm font-medium ${colors.detail} leading-relaxed max-w-2xl`}>{cfg.detail}</p>

                {/* Progress steps */}
                <div className="flex items-center gap-0 mt-2 flex-wrap">
                    {STEPS.map((step, i) => (
                        <React.Fragment key={step.label}>
                            <div
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border
                                    ${step.done
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                        : step.active
                                            ? `${colors.step} animate-pulse`
                                            : 'bg-white border-ink-black/20 text-ink-muted'
                                    }`}
                            >
                                {step.done ? '✓ ' : step.active ? '● ' : ''}{step.label}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className="w-6 h-0.5 bg-ink-black/10 mx-1 flex-shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Call to action */}
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm">
                <div>
                    <h3 className="font-black text-ink-black">Ensure your documents are complete</h3>
                    <p className="text-xs text-ink-muted font-medium mt-0.5">
                        Upload all required credential documents to speed up your verification.
                    </p>
                </div>
                <Link
                    to="/doctor/documents"
                    className="px-5 py-2.5 rounded-xl bg-ink-black text-white text-sm font-black hover:bg-ink-charcoal transition flex-shrink-0"
                >
                    📄 Manage Documents →
                </Link>
            </div>

            {/* What happens next */}
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
                <h3 className="font-black text-ink-black text-sm">What happens after verification?</h3>
                <ul className="flex flex-col gap-2">
                    {[
                        '🗓  Configure your consultation slots and availability',
                        '👥  Accept patient consultations from the OPD queue',
                        '📹  Start telemedicine sessions with patients',
                        '💊  Issue digital prescriptions and referrals',
                    ].map((item) => (
                        <li key={item} className="text-xs text-ink-charcoal font-semibold flex items-start gap-2">
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DoctorDashboard = () => {
    const { user } = useAuth();

    if (!user || user.role !== 'doctor') {
        return (
            <div className="p-6 text-center font-bold text-red-500">
                Access Denied. Only Doctor Role authorized.
            </div>
        );
    }

    const verificationStatus = user.profile?.verificationStatus || 'PENDING_VERIFICATION';
    const isVerified = verificationStatus === 'VERIFIED';

    // ── Gate: not yet verified ─────────────────────────────────────────────
    if (!isVerified) {
        return <VerificationGate status={verificationStatus} />;
    }

    // ── Verified: show real dashboard ──────────────────────────────────────
    const profile = user.profile || {};

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-sm">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black text-ink-black">{profile.fullName || 'Doctor'}</h2>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                            ✓ Verified
                        </span>
                    </div>
                    <p className="text-sm font-semibold text-ink-charcoal">
                        {profile.specialization || 'General Practitioner'} · {profile.city || 'N/A'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col gap-4">
                    <DoctorQueueList />
                </div>
                <div>
                    <DoctorOutbreakWidget />
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
