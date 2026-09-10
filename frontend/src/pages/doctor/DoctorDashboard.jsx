import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import DoctorOutbreakWidget from '../../components/doctor/DoctorOutbreakWidget';
import DoctorQueueList from '../../components/doctor/DoctorQueueList';
import DoctorReferralForm from './DoctorReferralForm';
import DoctorActiveConsultations from '../../components/doctor/DoctorActiveConsultations';
import DoctorIncomingReferrals from '../../components/doctor/DoctorIncomingReferrals';
import CareHeroBanner from '../../components/common/CareHeroBanner';
import Badge from '../../components/common/Badge';

const STATUS_MESSAGES = {
    PENDING_VERIFICATION: {
        emoji: '⏳',
        title: 'Application Under Review',
        subtitle: 'Your account is pending admin verification.',
        detail:
            'Our team has received your registration and will review your submitted documents. This typically takes 1–2 business days.',
        variant: 'peach',
    },
    UNDER_REVIEW: {
        emoji: '🔍',
        title: 'Active Document Review',
        subtitle: 'An admin is currently reviewing your credentials.',
        detail:
            'Your documents are being examined by our verification team. You may upload or replace documents while your application is being reviewed.',
        variant: 'sky',
    },
    REJECTED: {
        emoji: '✗',
        title: 'Application Rejected',
        subtitle: 'Your verification request was not approved.',
        detail:
            'Please check any admin notes, correct the issues, re-upload your documents, and contact support if you believe this is an error.',
        variant: 'pink',
    },
    SUSPENDED: {
        emoji: '🚫',
        title: 'Account Suspended',
        subtitle: 'Your account has been suspended by an administrator.',
        detail:
            'Please contact Sanjeevani support for further assistance regarding your account status.',
        variant: 'pink',
    },
};

const STEPS = [
    { label: 'Register', done: true },
    { label: 'Upload Documents', done: true },
    { label: 'Under Admin Review', active: true },
    { label: 'Verified & Active', done: false },
];

const VerificationGate = ({ status }) => {
    const cfg = STATUS_MESSAGES[status] || STATUS_MESSAGES.PENDING_VERIFICATION;

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            <div className="rounded-3xl border border-[#f5e4ec] bg-white p-8 shadow-xs flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">{cfg.emoji}</span>
                    <div>
                        <h2 className="text-2xl font-black text-[#2d2329] font-heading">{cfg.title}</h2>
                        <p className="text-xs font-bold text-[#7d6974] mt-0.5">{cfg.subtitle}</p>
                    </div>
                </div>
                <p className="text-xs font-semibold text-[#4a3c45] leading-relaxed max-w-2xl">{cfg.detail}</p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {STEPS.map((step, i) => (
                        <React.Fragment key={step.label}>
                            <Badge
                                variant={step.done ? 'mint' : step.active ? 'pink' : 'muted'}
                                pulse={step.active}
                            >
                                {step.done ? '✓ ' : step.active ? '● ' : ''}{step.label}
                            </Badge>
                            {i < STEPS.length - 1 && (
                                <div className="w-4 h-0.5 bg-[#f5e4ec] flex-shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-xs">
                <div>
                    <h3 className="font-black text-[#2d2329] text-sm">Ensure your documents are complete</h3>
                    <p className="text-xs text-[#7d6974] font-medium mt-0.5">
                        Upload all required credential documents to speed up your verification.
                    </p>
                </div>
                <Link
                    to="/doctor/documents"
                    className="px-5 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs transition flex-shrink-0"
                >
                    📄 Manage Documents →
                </Link>
            </div>
        </div>
    );
};

const DoctorDashboard = () => {
    const { user } = useAuth();

    if (!user || user.role !== 'doctor') {
        return (
            <div className="p-6 text-center font-bold text-rose-600">
                Access Denied. Only Doctor Role authorized.
            </div>
        );
    }

    const verificationStatus = user.profile?.verificationStatus || 'PENDING_VERIFICATION';
    const isVerified = verificationStatus === 'VERIFIED';

    if (!isVerified) {
        return <VerificationGate status={verificationStatus} />;
    }

    const profile = user.profile || {};

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            <CareHeroBanner
                headline="Care. Connect. Heal."
                tagline="Delivering compassionate, accessible healthcare every day."
            />

            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-xs">
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                            Dr. {profile.fullName || 'Doctor'}
                        </h2>
                        <Badge variant="mint" dot>
                            Verified Practitioner
                        </Badge>
                    </div>
                    <p className="text-xs font-bold text-[#7d6974]">
                        {profile.specialization || 'General Practitioner'} · {profile.city || 'N/A'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <DoctorActiveConsultations />
                    <DoctorQueueList />
                </div>
                <div>
                    <DoctorOutbreakWidget />
                </div>
            </div>

            <DoctorIncomingReferrals />
            <DoctorReferralForm />
        </div>
    );
};

export default DoctorDashboard;
