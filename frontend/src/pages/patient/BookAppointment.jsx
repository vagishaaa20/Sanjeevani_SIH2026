import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useGeolocation from '../../hooks/useGeolocation';
import doctorService from '../../services/doctorService';
import api from '../../services/api';
import NearbyDoctorCard from '../../components/patient/NearbyDoctorCard';
import Modal from '../../components/common/Modal';
import { 
    Calendar, 
    Clock, 
    Building2, 
    CheckCircle2, 
    ArrowLeft, 
    Sparkles, 
    AlertCircle, 
    Loader2, 
    Ticket, 
    User,
    MapPin
} from 'lucide-react';

const TIME_SLOTS = [
    { id: 'm1', label: '10:00 AM – 11:00 AM', period: 'Morning' },
    { id: 'm2', label: '11:30 AM – 12:30 PM', period: 'Morning' },
    { id: 'a1', label: '02:30 PM – 03:30 PM', period: 'Afternoon' },
    { id: 'e1', label: '05:00 PM – 06:00 PM', period: 'Evening' },
    { id: 'e2', label: '06:30 PM – 07:30 PM', period: 'Evening' },
    { id: 'e3', label: '07:30 PM – 08:30 PM', period: 'Evening' },
];

const BookAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { coords, permissionDenied, loading: geoLoading } = useGeolocation();

    // Triage context if navigated from AiTriage
    const triageState = location.state || {};

    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [doctorsError, setDoctorsError] = useState(null);

    // Filter/search
    const [selectedSpecialty, setSelectedSpecialty] = useState(triageState.specialization || 'All');

    // Booking modal state
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0].label);
    const [symptoms, setSymptoms] = useState(triageState.symptoms || '');
    const [notes, setNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [confirmedAppointment, setConfirmedAppointment] = useState(null);
    const [bookingError, setBookingError] = useState('');

    useEffect(() => {
        if (!coords) return;
        setDoctorsLoading(true);
        doctorService
            .getNearbyDoctors({ lat: coords.lat, lng: coords.lng })
            .then((res) => {
                setDoctors(res.doctors || []);
            })
            .catch(() => setDoctorsError('Could not load nearby verified doctors.'))
            .finally(() => setDoctorsLoading(false));
    }, [coords]);

    const handleBook = (doctor) => {
        setSelectedDoctor(doctor);
        setConfirmedAppointment(null);
        setBookingError('');
        if (triageState.symptoms && !symptoms) {
            setSymptoms(triageState.symptoms);
        }
    };

    const handleConfirmBook = async () => {
        if (!selectedDoctor) return;
        setBookingLoading(true);
        setBookingError('');

        try {
            const payload = {
                doctorId: selectedDoctor.userId,
                clinicId: selectedDoctor.clinicId || null,
                appointmentDate,
                timeSlot: selectedTimeSlot,
                symptoms: symptoms || triageState.symptoms || null,
                notes: notes || null,
                type: 'clinic_visit',
            };

            const res = await api.post('/appointments', payload);
            if (res.data?.success && res.data?.appointment) {
                setConfirmedAppointment(res.data.appointment);
            } else {
                throw new Error(res.data?.error || 'Booking failed');
            }
        } catch (err) {
            console.error('In-person clinic booking error:', err);
            setBookingError(
                err.response?.data?.error || err.message || 'Failed to confirm clinic appointment.'
            );
        } finally {
            setBookingLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedDoctor(null);
        setConfirmedAppointment(null);
        setBookingError('');
    };

    const filteredDoctors = selectedSpecialty === 'All' 
        ? doctors 
        : doctors.filter(d => (d.specialization || '').toLowerCase().includes(selectedSpecialty.toLowerCase()));

    const uniqueSpecialties = ['All', ...new Set(doctors.map(d => d.specialization).filter(Boolean))];

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 text-left pb-16 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(triageState.symptoms ? '/patient/ai-triage' : '/patient/dashboard')}
                        className="p-2 rounded-xl transition cursor-pointer hover:opacity-80 flex items-center justify-center"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        title="Go Back"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#e13b68]">
                            In-Person Clinic Visits
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                            Book a Clinic Consultation
                        </h1>
                        <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            Select a nearby verified doctor, choose your preferred clinic timing, and receive your OPD token.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/patient/my-consultations')}
                    className="px-4 py-2.5 rounded-full font-bold text-xs transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                    <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span>My Appointments</span>
                </button>
            </div>

            {/* Triage Referral Alert if coming from triage */}
            {triageState.symptoms && (
                <div
                    className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in"
                    style={{ background: 'var(--pastel-peach-bg)', border: '1px solid var(--pastel-peach-text)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold" style={{ background: 'var(--bg-surface)', color: 'var(--pastel-peach-text)' }}>
                            🩺
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#914614]">
                                Triage Recommendation Linked
                            </span>
                            <p className="text-xs font-bold text-[#44220b]">
                                {triageState.temporaryDiagnosis || 'In-Person Examination Recommended'}
                                {triageState.specialization && ` · Suggested: ${triageState.specialization}`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Location / Status alerts */}
            {geoLoading && (
                <div className="p-4 rounded-2xl flex items-center gap-3 text-xs font-bold" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <Loader2 className="w-4 h-4 animate-spin text-[#e13b68]" />
                    <span>Locating verified healthcare practices near you…</span>
                </div>
            )}

            {permissionDenied && (
                <div
                    className="p-4 rounded-2xl text-xs font-semibold flex items-center gap-2"
                    style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Location access is denied. Showing available verified doctors from the central registry.</span>
                </div>
            )}

            {doctorsError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{doctorsError}</span>
                </div>
            )}

            {/* Specialty Filter Pills */}
            {uniqueSpecialties.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {uniqueSpecialties.map((spec) => {
                        const isSelected = selectedSpecialty.toLowerCase() === spec.toLowerCase();
                        return (
                            <button
                                key={spec}
                                type="button"
                                onClick={() => setSelectedSpecialty(spec)}
                                className="px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer"
                                style={
                                    isSelected
                                        ? { background: 'var(--accent)', color: '#ffffff' }
                                        : { background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                                }
                            >
                                {spec}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Doctor Grid */}
            {!doctorsLoading && filteredDoctors.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDoctors.map((doctor) => (
                        <NearbyDoctorCard
                            key={doctor.userId}
                            doctor={doctor}
                            onBook={handleBook}
                            bookingType="clinic_visit"
                        />
                    ))}
                </div>
            )}

            {!doctorsLoading && !doctorsError && filteredDoctors.length === 0 && (
                <div
                    className="rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3 shadow-xs"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <Building2 className="w-12 h-12 text-[#7d6974]" />
                    <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                        No Doctors Found for Selected Criteria
                    </h3>
                    <p className="text-xs max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                        Try switching to "All" specialties to see all available medical practitioners.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSelectedSpecialty('All')}
                        className="mt-2 px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer text-white"
                        style={{ background: 'var(--accent)' }}
                    >
                        View All Doctors
                    </button>
                </div>
            )}

            {/* Interactive Clinic Booking Modal */}
            <Modal
                isOpen={!!selectedDoctor}
                onClose={closeModal}
                title={confirmedAppointment ? 'Clinic Appointment Confirmed!' : `Schedule In-Person Clinic Visit`}
            >
                {confirmedAppointment ? (
                    <div className="flex flex-col gap-5 text-left animate-fade-in">
                        <div
                            className="p-5 rounded-2xl flex flex-col gap-3"
                            style={{ background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-text)' }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-black text-sm" style={{ color: 'var(--pastel-mint-text)' }}>
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>OPD Token #{confirmedAppointment.tokenNumber} Assigned</span>
                                </div>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    Confirmed
                                </span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-cream-card/80 border border-emerald-200 text-xs flex flex-col gap-1.5">
                                <div>
                                    <span className="font-bold text-gray-500">Physician: </span>
                                    <span className="font-black text-gray-900">Dr. {selectedDoctor?.fullName}</span>
                                    <span className="text-gray-500 text-[11px]"> ({selectedDoctor?.specialization})</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500">Clinic / Hospital: </span>
                                    <span className="font-semibold text-gray-800">{selectedDoctor?.clinicName || selectedDoctor?.clinicOrHospital || 'Clinic Chamber'}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500">Date &amp; Timing: </span>
                                    <span className="font-bold text-emerald-900">
                                        {new Date(confirmedAppointment.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {confirmedAppointment.timeSlot}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500">Consultation Fee: </span>
                                    <span className="font-semibold text-gray-800">₹{selectedDoctor?.consultationFee || 500} (Pay at Clinic)</span>
                                </div>
                            </div>

                            <p className="text-[11px] font-medium leading-relaxed" style={{ color: 'var(--pastel-mint-text)' }}>
                                📌 Please arrive at the clinic 10 minutes before your slot with your Token #<strong>{confirmedAppointment.tokenNumber}</strong>.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-3 rounded-xl font-bold text-xs transition cursor-pointer text-white"
                                style={{ background: 'var(--accent)' }}
                            >
                                Done
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    closeModal();
                                    navigate('/patient/my-consultations');
                                }}
                                className="px-5 py-3 rounded-xl font-bold text-xs border border-gray-300 bg-cream-card hover:bg-gray-50 text-gray-700 transition"
                            >
                                View My Consultations
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 text-left">
                        {/* Doctor Summary Header */}
                        <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                                {selectedDoctor?.fullName?.charAt(0) || 'D'}
                            </div>
                            <div className="flex flex-col">
                                <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    Dr. {selectedDoctor?.fullName}
                                </h4>
                                <p className="text-xs font-bold text-[#e13b68]">
                                    {selectedDoctor?.specialization}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                    📍 {selectedDoctor?.clinicName || selectedDoctor?.clinicOrHospital || 'Clinic Chamber'} · {selectedDoctor?.city || 'Local Area'}
                                </p>
                            </div>
                        </div>

                        {/* Date Picker (Today, Tomorrow, Custom) */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                1. Select Visit Date
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {['Today', 'Tomorrow'].map((preset) => {
                                    const targetDate = new Date();
                                    if (preset === 'Tomorrow') targetDate.setDate(targetDate.getDate() + 1);
                                    const dateStr = targetDate.toISOString().split('T')[0];
                                    const isSelected = appointmentDate === dateStr;

                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setAppointmentDate(dateStr)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border"
                                            style={
                                                isSelected
                                                    ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--notif-unread-border)' }
                                                    : { background: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }
                                            }
                                        >
                                            {preset} ({targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                                        </button>
                                    );
                                })}

                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none"
                                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        {/* Time Slot Picker */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                2. Choose Time Slot
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {TIME_SLOTS.map((slot) => {
                                    const isSelected = selectedTimeSlot === slot.label;
                                    return (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            onClick={() => setSelectedTimeSlot(slot.label)}
                                            className="p-2.5 rounded-xl text-xs font-bold transition cursor-pointer border text-left flex items-center justify-between"
                                            style={
                                                isSelected
                                                    ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--notif-unread-border)' }
                                                    : { background: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }
                                            }
                                        >
                                            <span>{slot.label}</span>
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#e13b68]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Symptoms / Notes */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                3. Reason for In-Person Visit
                            </label>
                            <textarea
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                placeholder="Describe chief complaint or symptoms for the doctor's clinic desk..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none resize-none"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        {bookingError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{bookingError}</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmBook}
                                disabled={bookingLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer text-white shadow-xs hover:shadow-sm disabled:opacity-50"
                                style={{ background: 'var(--accent)' }}
                            >
                                {bookingLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Confirming...</span>
                                    </div>
                                ) : (
                                    <span>Confirm Clinic Appointment (₹{selectedDoctor?.consultationFee || 500})</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BookAppointment;
