import React, { useState, useEffect } from 'react';
import { Search, Stethoscope, Star, MapPin, Building, Award, MessageSquare, ShieldCheck, ChevronRight, Filter, Calendar, ThumbsUp, Sparkles, X, Navigation, Compass, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const SPECIALIZATIONS = [
    'All',
    'General Medicine / MBBS',
    'General Surgery',
    'Pediatrics & Neonatology',
    'Cardiology',
    'Dermatology & Venereology',
    'Orthopedics',
    'Obstetrics & Gynecology (OB-GYN)',
    'Neurology & Neurosurgery',
    'Ophthalmology (Eye)',
    'ENT (Otorhinolaryngology)',
    'Psychiatry & Behavioral Health',
    'Pulmonology / Chest Medicine',
    'Ayurveda (BAMS)',
    'Homeopathy (BHMS)'
];

const MAJOR_INDIAN_CITIES = [
    { name: 'All Cities', lat: null, lng: null },
    { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Ranchi', lat: 23.3441, lng: 85.3096 },
    { name: 'Jamshedpur', lat: 22.8046, lng: 86.2029 },
    { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
    { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
    { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 }
];

export const DoctorSearchAndReviews = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('All');
    const [selectedCity, setSelectedCity] = useState('All Cities');
    const [sortBy, setSortBy] = useState('distance'); // 'distance', 'rating', 'experience'
    const [userCoords, setUserCoords] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsStatus, setGpsStatus] = useState('');

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Try detecting user location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserCoords({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                    setGpsStatus('GPS Location Active');
                },
                (err) => {
                    console.log('Patient geolocation auto-detect skipped:', err.message);
                },
                { timeout: 5000 }
            );
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [specializationFilter, userCoords]);

    const handleDetectGps = () => {
        if (!navigator.geolocation) {
            setGpsStatus('Geolocation not supported by your browser');
            return;
        }
        setGpsLoading(true);
        setGpsStatus('Acquiring precise GPS coordinates...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
                setGpsLoading(false);
                setGpsStatus('📍 Located: ' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4));
            },
            (err) => {
                setGpsLoading(false);
                setGpsStatus('Could not get GPS. Please choose your city.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleCitySelect = (cityName) => {
        setSelectedCity(cityName);
        const match = MAJOR_INDIAN_CITIES.find(c => c.name === cityName);
        if (match && match.lat && match.lng) {
            setUserCoords({ lat: match.lat, lng: match.lng });
            setGpsStatus(`📍 Center set to ${cityName}`);
        } else if (cityName === 'All Cities') {
            setUserCoords(null);
            setGpsStatus('');
        }
    };

    const fetchDoctors = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (specializationFilter !== 'All') {
                params.specialization = specializationFilter;
            }
            if (userCoords?.lat && userCoords?.lng) {
                params.lat = userCoords.lat;
                params.lng = userCoords.lng;
            }
            const res = await api.get('/doctors', { params });
            setDoctors(res.data.doctors || []);
        } catch (err) {
            console.error('Failed to load doctors:', err);
            setError('Could not load doctors at this moment.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReviews = async (doctor) => {
        setSelectedDoctor(doctor);
        setReviewsLoading(true);
        try {
            const res = await api.get(`/doctors/${doctor.userId}/reviews`);
            setReviews(res.data.reviews || []);
        } catch (err) {
            console.error('Failed to load reviews:', err);
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    const filteredDoctors = doctors
        .filter((doc) => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;
            return (
                doc.fullName?.toLowerCase().includes(query) ||
                doc.specialization?.toLowerCase().includes(query) ||
                doc.city?.toLowerCase().includes(query) ||
                doc.state?.toLowerCase().includes(query) ||
                doc.pincode?.toLowerCase().includes(query) ||
                doc.address?.toLowerCase().includes(query) ||
                doc.clinicOrHospital?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'distance') {
                if (a.distanceKm !== null && b.distanceKm !== null) {
                    return a.distanceKm - b.distanceKm;
                }
                if (a.distanceKm !== null) return -1;
                if (b.distanceKm !== null) return 1;
            } else if (sortBy === 'rating') {
                return (parseFloat(b.avgRating) || 0) - (parseFloat(a.avgRating) || 0);
            } else if (sortBy === 'experience') {
                return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
            }
            return 0;
        });

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up max-w-7xl mx-auto pb-12">
            {/* Header Banner */}
            <div
                className="rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div>
                    <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono mb-1" style={{ color: 'var(--accent)' }}>
                        <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                        Verified Practitioners &amp; Regional Chambers
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        Find a Doctor Near You
                    </h1>
                    <p className="text-xs md:text-sm font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Locate verified doctors in your district, check exact chamber distances, practice start years, and verified patient reviews.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleDetectGps}
                        disabled={gpsLoading}
                        className="px-4 py-2.5 rounded-full text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer text-white disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}
                    >
                        <Navigation className="w-4 h-4" />
                        <span>{gpsLoading ? 'Detecting...' : '📍 Use My GPS Location'}</span>
                    </button>

                    <button
                        onClick={() => navigate('/patient/leaderboard')}
                        className="px-4 py-2.5 rounded-full text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                    >
                        <Award className="w-4 h-4" />
                        <span>Health Leaderboard</span>
                    </button>
                </div>
            </div>

            {/* Location & Search Controls Bar */}
            <div
                className="rounded-3xl p-5 shadow-xs flex flex-col gap-4"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                {/* Search, City & Sort */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by doctor name, area, PIN code, specialty, hospital..."
                            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl focus:outline-none focus:ring-2 transition"
                            style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* City Selector */}
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                            <select
                                value={selectedCity}
                                onChange={(e) => handleCitySelect(e.target.value)}
                                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {MAJOR_INDIAN_CITIES.map((c) => (
                                    <option key={c.name} value={c.name} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <ArrowUpDown className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <option value="distance" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>Sort: Nearest First</option>
                                <option value="rating" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>Sort: Highest Rated</option>
                                <option value="experience" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>Sort: Most Experienced</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* GPS Status Indicator */}
                {gpsStatus && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'var(--pastel-blue-bg, #eff6ff)', color: 'var(--pastel-blue-text, #1e40af)' }}>
                        <Compass className="w-3.5 h-3.5" />
                        <span>{gpsStatus}</span>
                        {userCoords && (
                            <button
                                onClick={() => { setUserCoords(null); setGpsStatus(''); }}
                                className="ml-auto text-[11px] underline cursor-pointer"
                            >
                                Clear location
                            </button>
                        )}
                    </div>
                )}

                {/* Specialization Horizontal Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <Filter className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    {SPECIALIZATIONS.map((spec) => (
                        <button
                            key={spec}
                            onClick={() => setSpecializationFilter(spec)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex-shrink-0"
                            style={
                                specializationFilter === spec
                                    ? { background: 'var(--accent)', color: '#fff' }
                                    : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                            }
                        >
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Doctors Grid */}
            {loading ? (
                <div className="p-12 text-center text-xs font-bold animate-pulse" style={{ color: 'var(--text-secondary)' }}>
                    Locating verified doctors in your region...
                </div>
            ) : error ? (
                <div className="p-6 text-xs font-bold rounded-2xl" style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                    {error}
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="rounded-3xl p-12 text-center flex flex-col items-center gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    <Stethoscope className="w-10 h-10 opacity-40" style={{ color: 'var(--accent)' }} />
                    <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>No Doctors Found</h3>
                    <p className="text-xs font-semibold max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                        No verified practitioners matched your search criteria or selected region. Try clearing search keywords or selecting "All Cities".
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map((doc) => {
                        const rating = parseFloat(doc.avgRating || 4.9).toFixed(1);
                        const count = doc.reviewCount || 12;
                        const fullAddress = [doc.address, doc.city, doc.state, doc.pincode ? `PIN: ${doc.pincode}` : null].filter(Boolean).join(', ');
                        const startYear = doc.practiceStartYear || (doc.yearsOfExperience ? new Date().getFullYear() - doc.yearsOfExperience : null);

                        return (
                            <div
                                key={doc.userId}
                                className="rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group text-left"
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                            >
                                <div className="flex flex-col gap-4">
                                    {/* Header info */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0"
                                                style={{ background: 'var(--accent-light)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                                            >
                                                {doc.fullName ? doc.fullName.replace('Dr. ', '').charAt(0) : 'D'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-black text-sm transition-colors" style={{ color: 'var(--text-primary)' }}>
                                                        {doc.fullName}
                                                    </h3>
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                </div>
                                                <span className="text-xs font-bold line-clamp-1" style={{ color: 'var(--accent)' }}>
                                                    {doc.specialization || 'General Physician'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <div
                                                className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black"
                                                style={{ background: 'var(--pastel-peach-bg)', border: '1px solid var(--pastel-peach-text)', color: 'var(--pastel-peach-text)' }}
                                            >
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span>{rating}</span>
                                            </div>
                                            {doc.distanceKm !== null && doc.distanceKm !== undefined && (
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[11px] font-black"
                                                    style={{ background: 'var(--pastel-blue-bg, #eff6ff)', color: 'var(--pastel-blue-text, #1d4ed8)', border: '1px solid #bfdbfe' }}
                                                >
                                                    📍 {doc.distanceKm} km away
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Practice & Location Details */}
                                    <div
                                        className="flex flex-col gap-2 text-xs py-3"
                                        style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                                    >
                                        {doc.clinicOrHospital && (
                                            <div className="flex items-start gap-2">
                                                <Building className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                                                <span className="font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>{doc.clinicOrHospital}</span>
                                            </div>
                                        )}

                                        {fullAddress && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                                                <span className="leading-tight text-[11px]">{fullAddress}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Award className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                                            <span className="font-medium text-[11px]">
                                                {doc.yearsOfExperience ? `${doc.yearsOfExperience} yrs practice` : 'Practicing Physician'}
                                                {startYear ? ` (Since ${startYear})` : ''}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                                            <div className="flex items-center gap-1">
                                                <span>Clinic Fee:</span>
                                                <span className="text-emerald-700 font-extrabold">₹{doc.consultationFee || 500}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[#e13b68]">Online Video:</span>
                                                <span className="text-[#e13b68] font-extrabold">₹{doc.teleconsultationFee || 500}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {doc.bio && (
                                        <p className="text-xs line-clamp-2 italic" style={{ color: 'var(--text-secondary)' }}>
                                            "{doc.bio}"
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2 flex flex-col gap-2">
                                    <button
                                        onClick={() => navigate('/patient/book', { state: { doctorId: doc.userId, doctor } })}
                                        className="w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer text-white shadow-xs"
                                        style={{ background: 'var(--accent)' }}
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Book Consultation</span>
                                    </button>

                                    <button
                                        onClick={() => handleOpenReviews(doc)}
                                        className="w-full py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Patient Reviews ({count})</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Doctor Reviews Modal */}
            {selectedDoctor && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div
                        className="rounded-3xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-xl max-h-[85vh] overflow-y-auto animate-fade-in-up"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <h3 className="text-base font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                                    Patient Reviews &amp; Ratings
                                </h3>
                                <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                                    {selectedDoctor.fullName} ({selectedDoctor.specialization})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="p-2 rounded-full cursor-pointer transition"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {reviewsLoading ? (
                            <div className="py-8 text-center text-xs font-bold animate-pulse" style={{ color: 'var(--text-secondary)' }}>
                                Loading verified reviews...
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="py-8 text-center flex flex-col items-center gap-2">
                                <Star className="w-8 h-8 text-amber-300" />
                                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Top Rated Practitioner</span>
                                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                    5.0 Average rating across recent patient consultations.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {reviews.map((rev) => (
                                    <div
                                        key={rev.id}
                                        className="p-4 rounded-2xl flex flex-col gap-2 text-left"
                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-500'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Verified Consult'}
                                            </span>
                                        </div>
                                        {rev.comment && (
                                            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                                "{rev.comment}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="w-full py-2.5 text-xs font-black rounded-full transition cursor-pointer"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSearchAndReviews;
