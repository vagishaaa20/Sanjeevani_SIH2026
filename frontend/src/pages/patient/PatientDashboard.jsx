import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { SocketContext } from '../../context/SocketContext';
import { useContext } from 'react';
import ngeohash from 'ngeohash';
import useTranslatedText from '../../hooks/useTranslatedText';
import TranslatedText from '../../components/common/TranslatedText';

// Feature grid card definitions
const FEATURE_CARDS = [
    {
        id: 'book',
        icon: '📅',
        title: 'Book an Appointment',
        subtitle: 'Find and book a doctor near you',
        route: '/patient/book-appointment',
        enabled: true,
        colors: 'border-ink-black hover:bg-ink-black hover:text-white',
    },
    {
        id: 'ai-triage',
        icon: '🤖',
        title: 'AI Symptom Checker',
        subtitle: 'Not sure what you need? Get instant guidance',
        route: '/patient/ai-triage',
        enabled: true,
        colors: 'border-ink-black hover:bg-ink-black hover:text-white',
    },
    {
        id: 'consultations',
        icon: '🩺',
        title: 'My Consultations',
        subtitle: 'View your appointment history and records',
        route: '/patient/consultations',
        enabled: true,
        colors: 'border-ink-black hover:bg-ink-black hover:text-white',
    },
    {
        id: 'subsidy',
        icon: '💰',
        title: 'Subsidy & Assistance',
        subtitle: 'Check your eligibility and savings',
        route: '/patient/subsidy',
        enabled: true,
        colors: 'border-ink-black hover:bg-ink-black hover:text-white',
    },
    {
        id: 'medicine',
        icon: '💊',
        title: 'Find Medicine',
        subtitle: 'Search nearby clinics for stock availability',
        route: '/patient/medicine-availability',
        enabled: true,
        colors: 'border-ink-black hover:bg-ink-black hover:text-white',
    },
    {
        id: 'outbreaks',
        icon: '🗺️',
        title: 'Epidemic Heatmap',
        subtitle: 'View live outbreak alerts in your area',
        route: '/patient/heatmap',
        enabled: true,
        colors: 'border-ink-black hover:bg-ink-black hover:text-white',
    },
    {
        id: 'requests',
        icon: '⏳',
        title: 'My Active Queue',
        subtitle: 'Check your waitlist position in real-time',
        route: '/patient/requests',
        enabled: true,
        colors: 'border-ink-black hover:bg-ink-black hover:text-white',
    },
];

export const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { coords, permissionDenied, loading: geoLoading } = useGeolocation();

    // Dynamic Translation Strings via Bhashini
    const welcomeText = useTranslatedText("Welcome back,");
    const quickActionsText = useTranslatedText("Quick Actions");

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
            console.log('Doctor accepted!', data);
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
            <div className="p-6 text-center font-bold text-red-500">
                Access Denied. Only Patient Role authorized.
            </div>
        );
    }

    const profile = user.profile || {};

    const userRegionGeohash = coords && coords.lat && coords.lng
        ? ngeohash.encode(coords.lat, coords.lng, 5)
        : null;

    return (
        <div className="w-full flex flex-col gap-6 text-left relative">
            {acceptedConsultationId && <PreCallDocumentSubmit consultationId={acceptedConsultationId} />}

            {/* Sticky Queue Banner */}
            <ActiveQueueBanner />

            {/* Outbreak Alert Banner */}
            {userRegionGeohash && <OutbreakBanner userRegionGeohash={userRegionGeohash} />}

            {/* Patient profile header */}
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-sm">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black text-ink-black">{profile.fullName || 'Patient Name'}</h2>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border border-cerulean bg-pastel-sky-soft text-cerulean-dark uppercase">
                            {profile.accountStatus || 'REGISTERED'}
                        </span>
                    </div>
                    <p className="text-sm font-semibold text-ink-charcoal">Phone: {user.phone}</p>
                </div>
                {/* WhatsApp connect button */}
                <button
                    type="button"
                    onClick={() => setWaModalOpen(true)}
                    title="Connect on WhatsApp"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm cursor-pointer transition-all hover:opacity-90 active:scale-95"
                    style={{ borderColor: '#25D366', backgroundColor: '#25D366', color: '#fff' }}
                >
                    <span className="text-base" aria-hidden="true">💬</span>
                    <span>WhatsApp</span>
                </button>
            </div>

            <WhatsAppModal isOpen={waModalOpen} onClose={() => setWaModalOpen(false)} />

            {/* ── Today's Medications Widget ── */}
            <TodaysMedicationsWidget />

            {/* ── 4-Block Feature Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURE_CARDS.map((card) => (
                    <button
                        key={card.id}
                        type="button"
                        disabled={!card.enabled}
                        onClick={() => card.enabled && navigate(card.route)}
                        className={`group bg-white border-2 rounded-2xl p-6 text-left flex flex-col gap-3 transition-all duration-200 ${card.colors} ${card.enabled ? 'cursor-pointer shadow-sm hover:shadow-md' : ''}`}
                    >
                        <span className="text-3xl">{card.icon}</span>
                        <div>
                            <h3 className="text-lg font-bold text-ink-black group-hover:text-white transition-colors duration-200">
                                <TranslatedText text={card.title} />
                            </h3>
                            <p className="text-xs font-semibold text-ink-charcoal group-hover:text-ink-muted transition-colors duration-200 mt-1">
                                <TranslatedText text={card.subtitle} />
                            </p>
                        </div>
                        {card.enabled ? (
                            <span className="text-xs font-bold uppercase tracking-wider text-cerulean flex items-center gap-1 group-hover:text-white transition-colors duration-200">
                                <TranslatedText text="Get started" /> &rarr;
                            </span>
                        ) : (
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                                <TranslatedText text="Coming Soon" />
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Nearby Clinics ── */}
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-ink-black">Nearby Clinics</h3>

                {geoLoading && <p className="text-sm text-ink-charcoal">Getting your location...</p>}
                {permissionDenied && (
                    <p className="text-sm text-ink-charcoal">
                        Location access denied. Enable location permission to see clinics near you.
                    </p>
                )}
                {clinicsLoading && <p className="text-sm text-ink-charcoal">Finding clinics near you...</p>}
                {clinicsError && <p className="text-sm text-red-500">{clinicsError}</p>}
                {!clinicsLoading && !clinicsError && coords && clinics.length === 0 && (
                    <p className="text-sm text-ink-charcoal">No verified clinics found nearby.</p>
                )}

                {clinics.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clinics.map((clinic) => (
                            <div
                                key={clinic.userId}
                                className="border-2 border-ink-black rounded-xl p-4 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-bold text-ink-black">{clinic.clinicName}</h4>
                                    <span className="text-xs font-semibold text-cerulean-dark whitespace-nowrap">
                                        {Number(clinic.distanceKm).toFixed(1)} km
                                    </span>
                                </div>
                                <p className="text-xs text-ink-muted">{clinic.address}</p>
                                <p className="text-xs text-ink-charcoal">
                                    {Number(clinic.doctorCount || 0)} doctor{Number(clinic.doctorCount || 0) !== 1 ? 's' : ''} available
                                </p>
                                {clinic.specializations?.filter(Boolean).length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {clinic.specializations.filter(Boolean).map((spec) => (
                                            <span
                                                key={spec}
                                                className="px-2 py-0.5 text-[10px] font-semibold rounded-full border border-cerulean bg-pastel-sky-soft text-cerulean-dark uppercase"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Nearby Recommended Doctors ── */}
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-ink-black">Nearby Recommended Doctors</h3>

                {geoLoading && <p className="text-sm text-ink-charcoal">Getting your location...</p>}
                {doctorsLoading && <p className="text-sm text-ink-charcoal">Finding doctors near you...</p>}
                {doctorsError && <p className="text-sm text-red-500">{doctorsError}</p>}
                {!doctorsLoading && !doctorsError && coords && doctors.length === 0 && (
                    <p className="text-sm text-ink-charcoal">No verified doctors found nearby.</p>
                )}

                {doctors.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.map((doctor) => (
                            <NearbyDoctorCard key={doctor.userId} doctor={doctor} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Demographics + Health Records ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-ink-black">Demographics Profile</h3>
                    <div className="flex flex-col gap-2">
                        <div>
                            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">Date of Birth</span>
                            <p className="font-semibold text-ink-black">{profile.dateOfBirth || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">Sex</span>
                            <p className="font-semibold text-ink-black capitalize">{profile.sex || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">Preferred Language</span>
                            <p className="font-semibold text-ink-black">{profile.preferredLanguage || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">Region</span>
                            <p className="font-semibold text-ink-black">{profile.region || 'N/A'}</p>
                        </div>
                        {profile.abhaNumber && (
                            <div>
                                <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">ABHA Number</span>
                                <p className="font-semibold text-ink-black">{profile.abhaNumber}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-ink-black">Longitudinal Health Records</h3>
                    <p className="text-sm text-ink-charcoal">
                        No health records or consultations found. Book an appointment or visit an operational OPD counter to update your queue token.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;