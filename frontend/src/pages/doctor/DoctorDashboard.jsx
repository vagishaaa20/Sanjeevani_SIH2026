import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import DoctorOutbreakWidget from '../../components/doctor/DoctorOutbreakWidget';
import DoctorQueueList from '../../components/doctor/DoctorQueueList';
import DoctorClinicAppointments from '../../components/doctor/DoctorClinicAppointments';
import DoctorActiveConsultations from '../../components/doctor/DoctorActiveConsultations';
import Badge from '../../components/common/Badge';
import MinimalistAvatar from '../../components/common/MinimalistAvatar';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';
import { 
    Users, 
    CheckCircle2, 
    Star, 
    Building, 
    Building2,
    ShieldCheck, 
    MapPin, 
    ArrowUpRight, 
    Stethoscope,
    Share2,
    Activity,
    FileText,
    Flame,
    User,
    Sparkles,
    Video
} from 'lucide-react';

const STATUS_MESSAGES = {
    PENDING_VERIFICATION: {
        title: 'Application Under Review',
        subtitle: 'Your account is pending admin verification.',
        detail:
            'Our team has received your registration and will review your submitted documents. This typically takes 1–2 business days.',
        variant: 'peach',
    },
    UNDER_REVIEW: {
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
        emoji: '✕',
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
            <div
                className="rounded-3xl p-8 shadow-xs flex flex-col gap-4"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center gap-4">
                    <span className="text-4xl">{cfg.emoji}</span>
                    <div>
                        <h2 className="text-2xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>{cfg.title}</h2>
                        <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{cfg.subtitle}</p>
                    </div>
                </div>
                <p className="text-xs font-semibold leading-relaxed max-w-2xl" style={{ color: 'var(--text-primary)' }}>{cfg.detail}</p>

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
                                <div className="w-4 h-0.5 flex-shrink-0" style={{ background: 'var(--border)' }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div
                className="rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-xs"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Manage Submitted Credentials</h3>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            View submitted degree certificates or upload additional NMC verification documents.
                        </p>
                    </div>
                </div>

                <Link
                    to="/doctor/profile"
                    className="px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-xs transition flex-shrink-0"
                    style={{ background: 'var(--accent)' }}
                >
                    📄 View Profile &amp; Documents →
                </Link>
            </div>
        </div>
    );
};

const DoctorDashboard = () => {
    const { user, refreshProfile } = useAuth();
    const [stats, setStats] = useState(null);
    const [practiceLocationsCount, setPracticeLocationsCount] = useState(1);
    const [activeViewTab, setActiveViewTab] = useState('all'); // 'all' | 'teleconsultation' | 'clinic'

    useEffect(() => {
        if (refreshProfile) refreshProfile();
    }, []);

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

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            {/* Executive Clinical Command Header */}
            <div
                className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center gap-4 md:gap-6 z-10">
                    <MinimalistAvatar
                        name={profile.fullName || 'Doctor'}
                        role="doctor"
                        size={68}
                        showStatus={true}
                        status="online"
                    />

                    <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl md:text-3xl font-black font-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                Dr. {profile.fullName || 'Doctor'}
                            </h1>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-bold">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                NMC Verified
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {profile.medicalRegistrationNumber && (
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                    <span>Reg:</span>
                                    <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile.medicalRegistrationNumber}</strong>
                                </span>
                            )}
                            {profile.city && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                    <span>{profile.city}, India</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 font-bold text-emerald-500">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Active for Consultations
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 z-10 self-start md:self-auto">
                    <Link
                        to="/doctor/profile"
                        className="px-4 py-2 rounded-full text-xs font-bold transition shadow-2xs flex items-center gap-1.5 hover:opacity-90"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        <User className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span>Profile &amp; Documents</span>
                    </Link>
                    <Link
                        to="/doctor/clinics"
                        className="px-4 py-2 rounded-full text-xs font-bold transition shadow-2xs flex items-center gap-1.5 hover:opacity-90"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span>Clinics ({practiceLocationsCount})</span>
                    </Link>
                    <Link
                        to="/doctor/referrals"
                        className="px-4 py-2 rounded-full text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                        style={{ background: 'var(--accent)' }}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Referral Desk</span>
                    </Link>
                </div>
            </div>

            {/* Quick Clinical Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center mb-1"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        {stats?.uniquePatients ?? 0}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Patients Checked</span>
                </div>

                <div
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        {stats?.completedConsultations ?? 0}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Consultations Done</span>
                </div>

                <div
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-1">
                        <Building className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        {practiceLocationsCount}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Practice Clinics</span>
                </div>

                <div
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                        Rating ({stats?.reviewCount ?? 0} reviews)
                    </span>
                </div>
            </div>

            {/* Main Clinical Grid: Active Calls & Queue on Left, Surveillance & Shortcuts on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <DoctorActiveConsultations />

                    {/* Desk Filter Tabs */}
                    <div className="flex items-center gap-2 p-1.5 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <button
                            type="button"
                            onClick={() => setActiveViewTab('all')}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                            style={activeViewTab === 'all'
                                ? { background: 'var(--accent)', color: '#ffffff' }
                                : { color: 'var(--text-secondary)' }
                            }
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>All Patient Desks</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveViewTab('teleconsultation')}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                            style={activeViewTab === 'teleconsultation'
                                ? { background: 'var(--accent)', color: '#ffffff' }
                                : { color: 'var(--text-secondary)' }
                            }
                        >
                            <Video className="w-3.5 h-3.5" />
                            <span>Teleconsultation Queue</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveViewTab('clinic')}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                            style={activeViewTab === 'clinic'
                                ? { background: 'var(--accent)', color: '#ffffff' }
                                : { color: 'var(--text-secondary)' }
                            }
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>In-Person Clinic Visits</span>
                        </button>
                    </div>

                    {(activeViewTab === 'all' || activeViewTab === 'teleconsultation') && (
                        <DoctorQueueList />
                    )}

                    {(activeViewTab === 'all' || activeViewTab === 'clinic') && (
                        <DoctorClinicAppointments />
                    )}
                </div>
                <div className="flex flex-col gap-6">
                    <DoctorOutbreakWidget />

                    {/* Rapid Clinical Shortcuts */}
                    <div
                        className="rounded-3xl p-6 shadow-xs flex flex-col gap-4"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <h3 className="font-black text-sm font-heading" style={{ color: 'var(--text-primary)' }}>
                            Clinical Shortcuts
                        </h3>
                        <div className="flex flex-col gap-2.5">
                            <Link
                                to="/doctor/referrals"
                                className="p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition group hover:opacity-90"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                <span className="flex items-center gap-2">
                                    <Share2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                    <span>Incoming ASHA Referrals</span>
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 transition-colors" style={{ color: 'var(--text-secondary)' }} />
                            </Link>

                            <Link
                                to="/doctor/clinics"
                                className="p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition group hover:opacity-90"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                <span className="flex items-center gap-2">
                                    <Building className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                    <span>Clinic Timings &amp; Fees</span>
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 transition-colors" style={{ color: 'var(--text-secondary)' }} />
                            </Link>

                            <Link
                                to="/doctor/heatmap"
                                className="p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition group hover:opacity-90"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                <span className="flex items-center gap-2">
                                    <Flame className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                    <span>Nationwide Epidemic Map</span>
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 transition-colors" style={{ color: 'var(--text-secondary)' }} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
