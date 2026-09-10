import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Bot, Stethoscope, HeartPulse, Pill, Map, Hourglass, ArrowRight, PhoneCall, Building2 } from 'lucide-react';
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
import CareHeroBanner from '../../components/common/CareHeroBanner';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { SocketContext } from '../../context/SocketContext';
import ngeohash from 'ngeohash';
import useTranslatedText from '../../hooks/useTranslatedText';
import TranslatedText from '../../components/common/TranslatedText';

const FEATURE_CARDS = [
    {
        id: 'book',
        icon: Calendar,
        title: 'Book an Appointment',
        subtitle: 'Find and book a doctor near you',
        route: '/patient/book-appointment',
        enabled: true,
        variant: 'pink',
    },
    {
        id: 'ai-triage',
        icon: Bot,
        title: 'AI Symptom Checker',
        subtitle: 'Not sure what you need? Get instant guidance',
        route: '/patient/ai-triage',
        enabled: true,
        variant: 'mint',
    },
    {
        id: 'consultations',
        icon: Stethoscope,
        title: 'My Consultations',
        subtitle: 'View your appointment history and records',
        route: '/patient/consultations',
        enabled: true,
        variant: 'lavender',
    },
    {
        id: 'subsidy',
        icon: HeartPulse,
        title: 'Subsidy & Assistance',
        subtitle: 'Check your eligibility and savings',
        route: '/patient/subsidy',
        enabled: true,
        variant: 'peach',
    },
    {
        id: 'medicine',
        icon: Pill,
        title: 'Find Medicine',
        subtitle: 'Search nearby clinics for stock availability',
        route: '/patient/medicine-availability',
        enabled: true,
        variant: 'pink',
    },
    {
        id: 'outbreaks',
        icon: Map,
        title: 'Epidemic Heatmap',
        subtitle: 'View live outbreak alerts in your area',
        route: '/patient/heatmap',
        enabled: true,
        variant: 'sky',
    },
    {
        id: 'requests',
        icon: Hourglass,
        title: 'My Active Queue',
        subtitle: 'Check your waitlist position in real-time',
        route: '/patient/requests',
        enabled: true,
        variant: 'mint',
    },
];

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
            .then((res) => setClinics(res.clinics))
            .catch(() => setClinicsError('Could not load nearby clinics.'))
            .finally(() => setClinicsLoading(false));

        setDoctorsLoading(true);
        doctorService
            .getNearbyDoctors({ lat: coords.lat, lng: coords.lng })
            .then((res) => setDoctors(res.doctors))
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
        <div className="w-full flex flex-col gap-6 text-left relative animate-fade-in-up">
            {acceptedConsultationId && <PreCallDocumentSubmit consultationId={acceptedConsultationId} />}

            {/* Banners */}
            <ActiveQueueBanner />
            {userRegionGeohash && <OutbreakBanner userRegionGeohash={userRegionGeohash} />}

            {/* Care Hero Banner */}
            <CareHeroBanner
                headline="Care. Connect. Heal."
                tagline="You are making a difference in someone's life today."
            />

            {/* Patient Header Card */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-xs">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                            {profile.fullName || 'Patient Name'}
                        </h2>
                        <Badge variant="pink" dot pulse>
                            {profile.accountStatus || 'REGISTERED'}
                        </Badge>
                    </div>
                    <p className="text-xs font-semibold text-[#7d6974]">Phone: {user.phone}</p>
                </div>

                <button
                    type="button"
                    onClick={() => setWaModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border-none font-bold text-xs md:text-sm cursor-pointer transition-all hover:opacity-90 shadow-xs"
                    style={{ backgroundColor: '#25D366', color: '#fff' }}
                >
                    <span className="text-base" aria-hidden="true">💬</span>
                    <span>WhatsApp Health Desk</span>
                </button>
            </div>

            <WhatsAppModal isOpen={waModalOpen} onClose={() => setWaModalOpen(false)} />

            {/* Today's Medications Widget */}
            <TodaysMedicationsWidget />

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

            {/* Quick Action Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURE_CARDS.map((card) => {
                    const IconComp = card.icon;
                    return (
                        <button
                            key={card.id}
                            type="button"
                            disabled={!card.enabled}
                            onClick={() => card.enabled && navigate(card.route)}
                            className="group bg-white border border-[#f5e4ec] hover:border-[#f8c8d8] rounded-3xl p-6 text-left flex flex-col justify-between gap-4 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] flex items-center justify-center text-[#e13b68] group-hover:scale-105 transition-transform">
                                    <IconComp className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-[#e13b68] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    <TranslatedText text="Start" /> <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </div>

                            <div>
                                <h3 className="text-base font-black text-[#2d2329] group-hover:text-[#e13b68] transition-colors font-heading">
                                    <TranslatedText text={card.title} />
                                </h3>
                                <p className="text-xs font-semibold text-[#7d6974] mt-1 leading-relaxed">
                                    <TranslatedText text={card.subtitle} />
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Nearby Clinics */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 flex flex-col gap-4 shadow-xs">
                <h3 className="text-lg font-black text-[#2d2329] font-heading">Nearby Clinics</h3>

                {geoLoading && <p className="text-xs font-semibold text-[#7d6974]">Getting your location...</p>}
                {permissionDenied && (
                    <p className="text-xs font-semibold text-[#7d6974]">
                        Location access denied. Enable location permission to see clinics near you.
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

            {/* Recommended Doctors */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 flex flex-col gap-4 shadow-xs">
                <h3 className="text-lg font-black text-[#2d2329] font-heading">Nearby Recommended Doctors</h3>

                {doctorsLoading && <p className="text-xs font-semibold text-[#7d6974]">Finding doctors near you...</p>}
                {doctorsError && <p className="text-xs font-semibold text-rose-600">{doctorsError}</p>}
                {!doctorsLoading && !doctorsError && coords && doctors.length === 0 && (
                    <p className="text-xs font-semibold text-[#7d6974]">No verified doctors found nearby.</p>
                )}

                {doctors.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.map((doctor) => (
                            <NearbyDoctorCard key={doctor.userId} doctor={doctor} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDashboard;