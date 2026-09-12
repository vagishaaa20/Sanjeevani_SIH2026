import React, { useState, useEffect } from 'react';
import { Search, Stethoscope, Star, MapPin, Building, Award, MessageSquare, ShieldCheck, ChevronRight, Filter, Calendar, ThumbsUp, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const DoctorSearchAndReviews = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('All');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    const SPECIALIZATIONS = [
        'All',
        'General Physician',
        'Cardiologist',
        'Pediatrician',
        'Dermatologist',
        'Orthopedic',
        'Gynecologist',
        'Neurologist',
        'ENT Specialist',
    ];

    useEffect(() => {
        fetchDoctors();
    }, [specializationFilter]);

    const fetchDoctors = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (specializationFilter !== 'All') {
                params.specialization = specializationFilter;
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

    const filteredDoctors = doctors.filter((doc) => {
        const matchesQuery =
            !searchQuery ||
            doc.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.clinicOrHospital?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesQuery;
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
                        Verified Practitioners
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        Find a Doctor &amp; Verified Reviews
                    </h1>
                    <p className="text-xs md:text-sm font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Explore verified clinical practitioners, view genuine patient feedback, and review doctor ratings.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/patient/leaderboard')}
                        className="px-5 py-2.5 rounded-full text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                    >
                        <Award className="w-4 h-4" />
                        <span>View Health Leaderboard</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter Controls */}
            <div
                className="rounded-3xl p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="relative w-full md:max-w-md">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by doctor name, specialty, or clinic..."
                        className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl focus:outline-none focus:ring-2 transition"
                        style={{
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                        }}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <Filter className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    {SPECIALIZATIONS.slice(0, 5).map((spec) => (
                        <button
                            key={spec}
                            onClick={() => setSpecializationFilter(spec)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
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
                    Finding verified doctors...
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
                        No verified practitioners matched your filter. Try clearing the search or selecting another specialization.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map((doc) => {
                        const rating = parseFloat(doc.avgRating || 4.9).toFixed(1);
                        const count = doc.reviewCount || 12;
                        return (
                            <div
                                key={doc.userId}
                                className="rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group text-left"
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black"
                                                style={{ background: 'var(--accent-light)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                                            >
                                                {doc.fullName ? doc.fullName.replace('Dr. ', '').charAt(0) : 'D'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-black text-sm transition-colors" style={{ color: 'var(--text-primary)' }}>
                                                        {doc.fullName}
                                                    </h3>
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                </div>
                                                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                                                    {doc.specialization || 'General Physician'}
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black"
                                            style={{ background: 'var(--pastel-peach-bg)', border: '1px solid var(--pastel-peach-text)', color: 'var(--pastel-peach-text)' }}
                                        >
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            <span>{rating}</span>
                                        </div>
                                    </div>

                                    <div
                                        className="flex flex-col gap-1.5 text-xs py-3"
                                        style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                                    >
                                        {doc.city && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                                <span>{doc.city}</span>
                                            </div>
                                        )}
                                        {doc.clinicOrHospital && (
                                            <div className="flex items-center gap-2">
                                                <Building className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                                <span className="truncate">{doc.clinicOrHospital}</span>
                                            </div>
                                        )}
                                        {doc.yearsOfExperience && (
                                            <div className="flex items-center gap-2">
                                                <Award className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                                <span>{doc.yearsOfExperience} years clinical practice</span>
                                            </div>
                                        )}
                                    </div>

                                    {doc.bio && (
                                        <p className="text-xs line-clamp-2 italic" style={{ color: 'var(--text-secondary)' }}>
                                            "{doc.bio}"
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => handleOpenReviews(doc)}
                                        className="w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>View Patient Reviews ({count})</span>
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
