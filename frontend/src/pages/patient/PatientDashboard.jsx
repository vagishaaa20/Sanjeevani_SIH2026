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
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-xs">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-xl font-black text-[#e13b68]">
                        {(profile.fullName || 'P').charAt(0)}
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h2 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                                {profile.fullName || 'Welcome, Patient'}
                            </h2>
                            <Badge variant="mint" dot>
                                {profile.accountStatus || 'ACTIVE'}
                            </Badge>
                        </div>
                        <p className="text-xs font-semibold text-[#7d6974] mt-0.5">
                            ABDM Health ID: {profile.abhaNumber || 'Pending Verification'} • Phone: {user.phone}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setWaModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full border-none font-bold text-xs md:text-sm cursor-pointer transition-all hover:opacity-90 shadow-xs"
                        style={{ backgroundColor: '#25D366', color: '#fff' }}
                    >
                        <MessageSquare className="w-4 h-4 fill-white text-[#25D366]" />
                        <span>WhatsApp Health Desk</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/patient/profile')}
                        className="px-4 py-2.5 rounded-full bg-[#fdf5f7] border border-[#f5e4ec] text-xs font-bold text-[#2d2329] hover:bg-[#ffe6ee] hover:text-[#e13b68] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                        <User className="w-4 h-4 text-[#e13b68]" />
                        <span>My Profile</span>
                    </button>
                </div>
            </div>

            <WhatsAppModal isOpen={waModalOpen} onClose={() => setWaModalOpen(false)} />

            {/* 🌟 MVP FLAGSHIP HERO: AI Clinical Triage & Symptom Checker */}
            <div className="relative overflow-hidden bg-linear-to-br from-[#ffeef3] via-[#fff9fb] to-[#fff0f5] border-2 border-[#f5c6d6] rounded-3xl p-6 md:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#e13b68] text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            Flagship Clinical Feature
                        </span>
                        <Badge variant="pink" dot pulse>
                            24/7 AI Triage Active
                        </Badge>
                    </div>

                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#2d2329] font-heading tracking-tight">
                        AI Clinical Triage & Symptom Assessment
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#66525f] leading-relaxed">
                        Describe your symptoms using natural voice or text. Our clinical AI model evaluates severity, checks for emergency flags, and immediately routes your case to a verified specialist.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
                    <button
                        onClick={() => navigate('/patient/ai-triage')}
                        className="px-8 py-4 bg-[#e13b68] hover:bg-[#c92a55] text-white rounded-full font-black text-sm md:text-base transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 group cursor-pointer"
                    >
                        <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Start AI Clinical Triage</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
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
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#fdf0f4] pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-[#fdf0f4] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68]">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#2d2329] font-heading">
                                Search Doctors & Verified Patient Feedback
                            </h3>
                            <p className="text-xs font-semibold text-[#7d6974]">
                                Read verified ratings and practitioner reviews before booking your clinical consultation.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/patient/doctors"
                        className="text-xs font-black text-[#e13b68] hover:underline flex items-center gap-1"
                    >
                        <span>Search All Doctors & Reviews</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {doctorsLoading && <p className="text-xs font-semibold text-[#7d6974]">Finding nearby doctors...</p>}
                {doctorsError && <p className="text-xs font-semibold text-rose-600">{doctorsError}</p>}
                {!doctorsLoading && !doctorsError && coords && doctors.length === 0 && (
                    <p className="text-xs font-semibold text-[#7d6974]">No verified doctors found nearby.</p>
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
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#fdf0f4] pb-3">
                    <h3 className="text-lg font-black text-[#2d2329] font-heading flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#e13b68]" />
                        <span>Nearby Partner Clinics</span>
                    </h3>
                    <Link to="/patient/medicine-availability" className="text-xs font-bold text-[#e13b68] hover:underline">
                        Check Clinic Medicines →
                    </Link>
                </div>

                {geoLoading && <p className="text-xs font-semibold text-[#7d6974]">Getting your location...</p>}
                {permissionDenied && (
                    <p className="text-xs font-semibold text-[#7d6974]">
                        Location access denied. Enable location permission to view clinics near you.
                    </p>
                )}
                {clinicsLoading && <p className="text-xs font-semibold text-[#7d6974]">Finding clinics near you...</p>}
                {clinicsError && <p className="text-xs font-semibold text-rose-600">{clinicsError}</p>}
                {!clinicsLoading && !clinicsError && coords && clinics.length === 0 && (
                    <p className="text-xs font-semibold text-[#7d6974]">No verified clinics found nearby.</p>
                )}

                {clinics.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clinics.map((clinic) => (
                            <div
                                key={clinic.userId}
                                className="border border-[#f5e4ec] bg-[#fdf5f7] rounded-2xl p-4 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-black text-xs md:text-sm text-[#2d2329]">{clinic.clinicName}</h4>
                                    <Badge variant="pink">{Number(clinic.distanceKm).toFixed(1)} km</Badge>
                                </div>
                                <p className="text-xs text-[#7d6974] font-medium">{clinic.address}</p>
                                <p className="text-xs font-bold text-[#4a3c45]">
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