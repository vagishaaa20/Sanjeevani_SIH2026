import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import DoctorOutbreakWidget from '../../components/doctor/DoctorOutbreakWidget';
import DoctorQueueList from '../../components/doctor/DoctorQueueList';
import DoctorActiveConsultations from '../../components/doctor/DoctorActiveConsultations';
import Badge from '../../components/common/Badge';
import MinimalistAvatar from '../../components/common/MinimalistAvatar';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';
import { 
    Users, 
    CheckCircle2, 
    Star, 
    Building, 
    ShieldCheck, 
    MapPin, 
    ArrowUpRight, 
    Stethoscope,
    Share2,
    Activity,
    FileText,
    Flame
} from 'lucide-react';

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
                    to="/doctor/profile"
                    className="px-5 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs transition flex-shrink-0"
                >
                    📄 View Profile & Documents →
                </Link>
            </div>
        </div>
    );
};

const DoctorDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [practiceLocationsCount, setPracticeLocationsCount] = useState(1);

    useEffect(() => {
        if (!user || user.role !== 'doctor') return;
        api.get('/doctors/stats/overview')
            .then((res) => {
                setStats(res.data?.stats || {});
                const locs = res.data?.practiceLocations || user?.profile?.availability?.practiceLocations || [];
                setPracticeLocationsCount(locs.length || 1);
            })
            .catch(() => {
                setStats({});
            });
    }, [user]);

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
    const doctorInitials = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'D';

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            {/* Executive Clinical Command Header */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-radial from-[#ffe6ee] to-transparent rounded-full pointer-events-none opacity-50" />

                <div className="flex items-start gap-4 md:gap-6 z-10">
                    <MinimalistAvatar
                        name={profile.fullName || 'Doctor'}
                        role="doctor"
                        size={72}
                        showStatus={true}
                        status="online"
                    />

                    <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl md:text-3xl font-black text-[#1c1218] font-heading tracking-tight">
                                Dr. {profile.fullName || 'Doctor'}
                            </h1>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                NMC Verified
                            </span>
                        </div>

                        <p className="text-xs md:text-sm font-bold text-[#e13b68]">
                            {profile.specialization || 'General Medicine & Specialist'}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7d6974] font-medium mt-1">
                            {profile.medicalRegistrationNumber && (
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#e13b68]" />
                                    Reg: <strong className="text-[#2d2329] font-bold">{profile.medicalRegistrationNumber}</strong>
                                </span>
                            )}
                            {profile.city && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-[#e13b68]" />
                                    {profile.city}, India
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Available for Consultations
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 z-10 self-start md:self-auto">
                    <Link
                        to="/doctor/profile"
                        className="px-4 py-2 rounded-full bg-white hover:bg-[#fff0f5] border border-[#f0d0dc] hover:border-[#e13b68]/40 text-[#2d2329] hover:text-[#e13b68] text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                        <User className="w-3.5 h-3.5 text-[#e13b68]" />
                        <span>Profile & Documents</span>
                    </Link>
                    <Link
                        to="/doctor/clinics"
                        className="px-4 py-2 rounded-full bg-white hover:bg-[#fff0f5] border border-[#f0d0dc] hover:border-[#e13b68]/40 text-[#2d2329] hover:text-[#e13b68] text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                        <Building2 className="w-3.5 h-3.5 text-[#e13b68]" />
                        <span>Clinics ({practiceLocationsCount})</span>
                    </Link>
                    <Link
                        to="/doctor/referrals"
                        className="px-4 py-2 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Referral Desk</span>
                    </Link>
                </div>
            </div>

            {/* Quick Clinical Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                    <div className="w-9 h-9 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center mb-1">
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        {stats?.uniquePatients ?? 0}
                    </span>
                    <span className="text-xs font-bold text-[#7d6974]">Patients Checked</span>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        {stats?.completedConsultations ?? 0}
                    </span>
                    <span className="text-xs font-bold text-[#7d6974]">Consultations Done</span>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                    <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1">
                        <Building className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        {practiceLocationsCount}
                    </span>
                    <span className="text-xs font-bold text-[#7d6974]">Practice Clinics</span>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs font-bold text-[#7d6974]">
                        Rating ({stats?.reviewCount ?? 0} reviews)
                    </span>
                </div>
            </div>

            {/* Main Clinical Grid: Active Calls & Queue on Left, Surveillance & Shortcuts on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <DoctorActiveConsultations />
                    <DoctorQueueList />
                </div>
                <div className="flex flex-col gap-6">
                    <DoctorOutbreakWidget />

                    {/* Rapid Clinical Shortcuts */}
                    <div className="bg-white rounded-3xl border border-[#f5e4ec] p-6 shadow-xs flex flex-col gap-4">
                        <h3 className="font-black text-[#2d2329] text-sm font-heading">
                            Clinical Shortcuts
                        </h3>
                        <div className="flex flex-col gap-2.5">
                            <Link
                                to="/doctor/referrals"
                                className="p-3 rounded-2xl bg-[#fffcfd] hover:bg-[#ffe6ee]/50 border border-[#f5e4ec] text-xs font-bold text-[#2d2329] flex items-center justify-between transition group"
                            >
                                <span className="flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-[#e13b68]" />
                                    <span>Incoming ASHA Referrals</span>
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#7d6974] group-hover:text-[#e13b68] transition-colors" />
                            </Link>

                            <Link
                                to="/doctor/clinics"
                                className="p-3 rounded-2xl bg-[#fffcfd] hover:bg-[#ffe6ee]/50 border border-[#f5e4ec] text-xs font-bold text-[#2d2329] flex items-center justify-between transition group"
                            >
                                <span className="flex items-center gap-2">
                                    <Building className="w-4 h-4 text-[#e13b68]" />
                                    <span>Clinic Timings & Fees</span>
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#7d6974] group-hover:text-[#e13b68] transition-colors" />
                            </Link>

                            <Link
                                to="/doctor/heatmap"
                                className="p-3 rounded-2xl bg-[#fffcfd] hover:bg-[#ffe6ee]/50 border border-[#f5e4ec] text-xs font-bold text-[#2d2329] flex items-center justify-between transition group"
                            >
                                <span className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-[#e13b68]" />
                                    <span>Nationwide Epidemic Map</span>
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#7d6974] group-hover:text-[#e13b68] transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
