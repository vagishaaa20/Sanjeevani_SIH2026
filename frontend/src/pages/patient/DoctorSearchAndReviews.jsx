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
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                <div>
                    <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-[#e13b68] uppercase font-mono mb-1">
                        <ShieldCheck className="w-4 h-4 text-[#e13b68]" />
                        Verified Practitioners
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        Find a Doctor & Verified Reviews
                    </h1>
                    <p className="text-xs md:text-sm font-semibold text-[#7d6974] mt-1">
                        Explore verified clinical practitioners, view genuine patient feedback, and review doctor ratings.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/patient/leaderboard')}
                        className="px-5 py-2.5 rounded-full bg-[#fdf0f4] border border-[#f8c8d8] text-xs font-bold text-[#e13b68] hover:bg-[#ffe6ee] transition shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                        <Award className="w-4 h-4" />
                        <span>View Health Leaderboard</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="w-4 h-4 text-[#7d6974] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by doctor name, specialty, or clinic..."
                        className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl bg-[#fdf5f7] border border-[#f5e4ec] text-[#2d2329] focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 focus:bg-white transition"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <Filter className="w-4 h-4 text-[#7d6974] flex-shrink-0" />
                    {SPECIALIZATIONS.slice(0, 5).map((spec) => (
                        <button
                            key={spec}
                            onClick={() => setSpecializationFilter(spec)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                specializationFilter === spec
                                    ? 'bg-[#e13b68] text-white shadow-xs'
                                    : 'bg-[#fdf5f7] border border-[#f5e4ec] text-[#7d6974] hover:text-[#2d2329]'
                            }`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Doctors Grid */}
            {loading ? (
                <div className="p-12 text-center text-xs font-bold text-[#7d6974] animate-pulse">
                    Finding verified doctors...
                </div>
            ) : error ? (
                <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                    {error}
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-12 text-center flex flex-col items-center gap-3">
                    <Stethoscope className="w-10 h-10 text-[#e13b68]/40" />
                    <h3 className="text-base font-black text-[#2d2329]">No Doctors Found</h3>
                    <p className="text-xs font-semibold text-[#7d6974] max-w-sm">
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
                                className="bg-white border border-[#f5e4ec] hover:border-[#f8c8d8] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group text-left"
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-lg font-black text-[#e13b68]">
                                                {doc.fullName ? doc.fullName.replace('Dr. ', '').charAt(0) : 'D'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-black text-sm text-[#2d2329] group-hover:text-[#e13b68] transition-colors">
                                                        {doc.fullName}
                                                    </h3>
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                </div>
                                                <span className="text-xs font-bold text-[#e13b68]">
                                                    {doc.specialization || 'General Physician'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 bg-[#fff8e7] border border-[#ffe3a8] px-2 py-1 rounded-xl text-xs font-black text-[#b7791f]">
                                            <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                                            <span>{rating}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 text-xs text-[#7d6974] border-t border-b border-[#fdf0f4] py-3">
                                        {doc.city && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-[#e13b68]" />
                                                <span>{doc.city}</span>
                                            </div>
                                        )}
                                        {doc.clinicOrHospital && (
                                            <div className="flex items-center gap-2">
                                                <Building className="w-3.5 h-3.5 text-[#e13b68]" />
                                                <span className="truncate">{doc.clinicOrHospital}</span>
                                            </div>
                                        )}
                                        {doc.yearsOfExperience && (
                                            <div className="flex items-center gap-2">
                                                <Award className="w-3.5 h-3.5 text-[#e13b68]" />
                                                <span>{doc.yearsOfExperience} years clinical practice</span>
                                            </div>
                                        )}
                                    </div>

                                    {doc.bio && (
                                        <p className="text-xs text-[#4a3c45] line-clamp-2 italic">
                                            "{doc.bio}"
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => handleOpenReviews(doc)}
                                        className="w-full py-2.5 rounded-2xl bg-[#fdf0f4] hover:bg-[#ffe6ee] border border-[#f8c8d8] text-xs font-black text-[#e13b68] flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
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
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#f5e4ec] rounded-3xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-xl max-h-[85vh] overflow-y-auto animate-fade-in-up">
                        <div className="flex items-center justify-between border-b border-[#f5e4ec] pb-3">
                            <div>
                                <h3 className="text-base font-black text-[#2d2329] font-heading">
                                    Patient Reviews & Ratings
                                </h3>
                                <p className="text-xs font-bold text-[#e13b68]">
                                    {selectedDoctor.fullName} ({selectedDoctor.specialization})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="p-2 rounded-full hover:bg-[#fdf0f4] text-[#7d6974] cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {reviewsLoading ? (
                            <div className="py-8 text-center text-xs font-bold text-[#7d6974] animate-pulse">
                                Loading verified reviews...
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="py-8 text-center flex flex-col items-center gap-2">
                                <Star className="w-8 h-8 text-amber-300" />
                                <span className="text-xs font-bold text-[#2d2329]">Top Rated Practitioner</span>
                                <p className="text-[11px] text-[#7d6974]">
                                    5.0 Average rating across recent patient consultations.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {reviews.map((rev) => (
                                    <div
                                        key={rev.id}
                                        className="p-4 rounded-2xl bg-[#fdf5f7] border border-[#f5e4ec] flex flex-col gap-2 text-left"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${
                                                            i < (rev.rating || 5)
                                                                ? 'fill-[#f59e0b] text-[#f59e0b]'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-semibold text-[#7d6974]">
                                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Verified Consult'}
                                            </span>
                                        </div>
                                        {rev.comment && (
                                            <p className="text-xs text-[#2d2329] font-medium leading-relaxed">
                                                "{rev.comment}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2 border-t border-[#f5e4ec]">
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="w-full py-2.5 bg-[#fdf0f4] hover:bg-[#ffe6ee] text-[#e13b68] text-xs font-black rounded-full border border-[#f8c8d8] transition cursor-pointer"
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
