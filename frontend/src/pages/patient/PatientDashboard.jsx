import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Bot,
    Stethoscope,
    HeartPulse,
    Pill,
    Hourglass,
    ArrowRight,
    MessageSquare,
    Building2,
    Sparkles,
    Mic,
    Star,
    ShieldCheck,
    Search,
    ChevronRight,
    User,
    Heart,
    Flame,
    Activity,
    ShieldAlert
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useGeolocation from '../../hooks/useGeolocation';
import clinicService from '../../services/clinicService';
import doctorService from '../../services/doctorService';
import NearbyDoctorCard from '../../components/patient/NearbyDoctorCard';
import WhatsAppModal from '../../components/patient/WhatsAppModal';
import TodaysMedicationsWidget from '../../components/patient/TodaysMedicationsWidget';
import OutbreakBanner from '../../components/patient/OutbreakBanner';
import PreCallDocumentSubmit from '../../components/patient/PreCallDocumentSubmit';
import ActiveQueueBanner from '../../components/patient/ActiveQueueBanner';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { SocketContext } from '../../context/SocketContext';
import ngeohash from 'ngeohash';

import MinimalistAvatar from '../../components/common/MinimalistAvatar';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';

export const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { coords, permissionDenied, loading: geoLoading } = useGeolocation();

    const [clinics, setClinics] = useState([]);
    const [clinicsLoading, setClinicsLoading] = useState(false);
    const [clinicsError, setClinicsError] = useState(null);

    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [doctorsError, setDoctorsError] = useState(null);

    const [waModalOpen, setWaModalOpen] = useState(false);
    const [acceptedConsultationId, setAcceptedConsultationId] = useState(null);
    const { socket } = useContext(SocketContext);

    useEffect(() => {
        if (!socket) return;
        const handleAccepted = (data) => {
            setAcceptedConsultationId(data.consultationId);
        };
        const handleCompleted = () => {
            setAcceptedConsultationId(null);
        };
        socket.on('consultation:accepted', handleAccepted);
        socket.on('consultation:completed', handleCompleted);
        return () => {
            socket.off('consultation:accepted', handleAccepted);
            socket.off('consultation:completed', handleCompleted);
        };
    }, [socket]);

    useEffect(() => {
        if (!coords) return;
        setClinicsLoading(true);
        clinicService
            .getNearbyClinics({ lat: coords.lat, lng: coords.lng })
            .then((res) => setClinics(res.clinics || []))
            .catch(() => setClinicsError('Could not load nearby clinics.'))
            .finally(() => setClinicsLoading(false));

        setDoctorsLoading(true);
        doctorService
            .getNearbyDoctors({ lat: coords.lat, lng: coords.lng })
            .then((res) => setDoctors(res.doctors || []))
            .catch(() => setDoctorsError('Could not load nearby doctors.'))
            .finally(() => setDoctorsLoading(false));
    }, [coords]);

    if (!user || user.role !== 'patient') {
        return (
            <div className="p-6 text-center font-bold text-rose-600">
                Access Denied. Only Patient Role authorized.
            </div>
        );
    }

    const profile = user.profile || {};
    const userRegionGeohash = coords && coords.lat && coords.lng
        ? ngeohash.encode(coords.lat, coords.lng, 5)
        : null;

    return (
        <div className="w-full flex flex-col gap-6 text-left relative animate-fade-in-up pb-12 max-w-7xl mx-auto">
            {acceptedConsultationId && <PreCallDocumentSubmit consultationId={acceptedConsultationId} />}

            {/* Live Alerts & Queue Banners */}
            <ActiveQueueBanner />
            {userRegionGeohash && <OutbreakBanner userRegionGeohash={userRegionGeohash} />}

            {/* Patient Header Bar */}
            <div
                className="backdrop-blur-md rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-xs"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center gap-4">
                    <MinimalistAvatar
                        name={profile.fullName || user.phone}
                        role="patient"
                        size={64}
                        showStatus={true}
                        status="online"
                    />
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black font-heading tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <span>{profile.fullName || 'Welcome, Patient'}</span>
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                ABDM Health ID: <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile.abhaNumber || 'Pending Verification'}</strong>
                            </span>
                            {user.phone && (
                                <>
                                    <span style={{ color: 'var(--border)' }}>•</span>
                                    <span>Phone: <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>{user.phone}</strong></span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setWaModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs md:text-sm cursor-pointer transition-all shadow-xs hover:shadow hover:scale-[1.02]"
                        style={{ background: '#25D366', color: '#ffffff' }}
                    >
                        <MessageSquare className="w-4 h-4 fill-white text-[#25D366]" />
                        <span>WhatsApp Health Desk</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/patient/profile')}
                        className="px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-xs hover:shadow flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                        <span>My Profile</span>
                    </button>
                </div>
            </div>

            <WhatsAppModal isOpen={waModalOpen} onClose={() => setWaModalOpen(false)} />

            {/* AI Clinical Triage & Symptom Checker Card */}
            <div
                className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex flex-col gap-2.5 max-w-2xl">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide w-fit"
                        style={{ background: 'var(--pastel-pink-bg)', color: 'var(--pastel-pink-text)', border: '1px solid var(--border)' }}
                    >
                        <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span>AI Clinical Intelligence</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black font-heading tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                        AI Clinical Triage & Symptom Assessment
                    </h3>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Describe your symptoms using voice or text. Our clinical AI model analyzes severity, checks for emergency flags, and routes your case directly to verified healthcare specialists.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
                    <button
                        onClick={() => navigate('/patient/ai-triage')}
                        className="px-7 py-3.5 text-white rounded-full font-bold text-xs sm:text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2.5 group cursor-pointer"
                        style={{ background: 'var(--accent)' }}
                    >
                        <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Start AI Clinical Triage</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Nearby Verified Clinics"
                    value={clinics.length}
                    icon={Building2}
                    variant="pink"
                    description="Operational in your area"
                />
                <StatCard
                    title="Recommended Doctors"
                    value={doctors.length}
                    icon={Stethoscope}
                    variant="mint"
                    description="Available for consult"
                />
                <StatCard
                    title="Health ABHA Status"
                    value={profile.abhaNumber ? 'Linked' : 'Pending'}
                    icon={HeartPulse}
                    variant="lavender"
                    description={profile.abhaNumber || 'Connect ABHA Digital ID'}
                />
            </div>

            {/* Today's Medications Widget */}
            <TodaysMedicationsWidget />

            {/* 🔍 Find Doctors & Patient Reviews Spotlight */}
            <div className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}>
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                                Search Doctors & Verified Patient Feedback
                            </h3>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Read verified ratings and practitioner reviews before booking your clinical consultation.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/patient/doctors"
                        className="text-xs font-black flex items-center gap-1"
                        style={{ color: 'var(--accent)' }}
                    >
                        <span>Search All Doctors & Reviews</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {doctorsLoading && <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Finding nearby doctors...</p>}
                {doctorsError && <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{doctorsError}</p>}
                {!doctorsLoading && !doctorsError && coords && doctors.length === 0 && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>No verified doctors found nearby.</p>
                )}

                {doctors.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.slice(0, 4).map((doctor) => (
                            <NearbyDoctorCard key={doctor.userId} doctor={doctor} />
                        ))}
                    </div>
                )}
            </div>

            {/* 🏥 Nearby Verified Clinics */}
            <div className="rounded-3xl p-6 md:p-8 flex flex-col gap-4 shadow-xs" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 className="text-lg font-black font-heading flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Building2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                        <span>Nearby Partner Clinics</span>
                    </h3>
                    <Link to="/patient/medicine-availability" className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                        Check Clinic Medicines →
                    </Link>
                </div>

                {geoLoading && <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Getting your location...</p>}
                {permissionDenied && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Location access denied. Enable location permission to view clinics near you.
                    </p>
                )}
                {clinicsLoading && <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Finding clinics near you...</p>}
                {clinicsError && <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{clinicsError}</p>}
                {!clinicsLoading && !clinicsError && coords && clinics.length === 0 && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>No verified clinics found nearby.</p>
                )}

                {clinics.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clinics.map((clinic) => (
                            <div
                                key={clinic.userId}
                                className="rounded-2xl p-4 flex flex-col gap-2"
                                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-black text-xs md:text-sm" style={{ color: 'var(--text-primary)' }}>{clinic.clinicName}</h4>
                                    <Badge variant="pink">{Number(clinic.distanceKm).toFixed(1)} km</Badge>
                                </div>
                                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{clinic.address}</p>
                                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {Number(clinic.doctorCount || 0)} doctor{Number(clinic.doctorCount || 0) !== 1 ? 's' : ''} available
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDashboard;