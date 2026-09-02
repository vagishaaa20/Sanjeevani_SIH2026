import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../../hooks/useGeolocation';
import doctorService from '../../services/doctorService';
import api from '../../services/api';
import NearbyDoctorCard from '../../components/patient/NearbyDoctorCard';
import Modal from '../../components/common/Modal';
import ActiveQueueBanner from '../../components/patient/ActiveQueueBanner';

const BookAppointment = () => {
    const navigate = useNavigate();
    const { coords, permissionDenied, loading: geoLoading } = useGeolocation();

    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [doctorsError, setDoctorsError] = useState(null);
    const [hasActiveQueue, setHasActiveQueue] = useState(false);

    // Booking modal state
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [bookingError, setBookingError] = useState('');

    useEffect(() => {
        if (!coords) return;
        setDoctorsLoading(true);
        doctorService
            .getNearbyDoctors({ lat: coords.lat, lng: coords.lng })
            .then((res) => setDoctors(res.doctors))
            .catch(() => setDoctorsError('Could not load nearby doctors.'))
            .finally(() => setDoctorsLoading(false));
    }, [coords]);

    const handleBook = (doctor) => {
        setSelectedDoctor(doctor);
        setBookingSuccess(null);
        setBookingError('');
    };

    const handleConfirmBook = async () => {
        if (!selectedDoctor) return;
        setBookingLoading(true);
        setBookingError('');
        try {
            const res = await api.post('/queues/request', { doctorId: selectedDoctor.userId });
            closeModal();
            navigate('/patient/requests');
        } catch (err) {
            setBookingError(
                err.response?.data?.error || 'Failed to submit request. Please try again.'
            );
        } finally {
            setBookingLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedDoctor(null);
        setBookingSuccess(null);
        setBookingError('');
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <ActiveQueueBanner onStateChange={(queue) => setHasActiveQueue(!!queue)} />

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate('/patient/dashboard')}
                    className="text-ink-muted hover:text-ink-black font-semibold text-sm flex items-center gap-1 cursor-pointer transition-colors"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-black text-ink-black">Book an Appointment</h2>
            </div>

            {/* Status messages */}
            {geoLoading && (
                <p className="text-sm text-ink-charcoal">Getting your location…</p>
            )}
            {permissionDenied && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-sm text-red-700 font-semibold">
                    Location access denied. Enable location permission to see nearby doctors.
                </div>
            )}
            {doctorsLoading && (
                <p className="text-sm text-ink-charcoal">Finding doctors near you…</p>
            )}
            {doctorsError && (
                <p className="text-sm text-red-500">{doctorsError}</p>
            )}

            {!doctorsLoading && !doctorsError && coords && doctors.length === 0 && (
                <div className="p-6 bg-white border-2 border-ink-black rounded-2xl text-center text-sm text-ink-charcoal">
                    No verified doctors found nearby. Try increasing the search radius.
                </div>
            )}

            {/* Doctor list */}
            {doctors.length > 0 && (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-ink-black">
                        {doctors.length} Doctor{doctors.length !== 1 ? 's' : ''} Available Nearby
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.map((doctor) => (
                            <NearbyDoctorCard
                                key={doctor.userId}
                                doctor={doctor}
                                onBook={handleBook}
                                hasActiveQueue={hasActiveQueue}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Booking modal */}
            <Modal
                isOpen={!!selectedDoctor}
                onClose={closeModal}
                title={bookingSuccess ? 'Booking Confirmed!' : `Book Consultation`}
            >
                {bookingSuccess ? (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl">
                            <p className="font-bold text-emerald-800 text-sm">
                                ✓ You're in the queue — Token #{bookingSuccess.queue?.tokenNumber}
                            </p>
                            <p className="text-xs text-emerald-700 mt-1">
                                Your consultation request with {selectedDoctor?.fullName} has been submitted.
                                Please arrive on time.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="w-full py-2.5 rounded-xl border-2 border-ink-black bg-ink-black text-white font-bold text-sm hover:bg-white hover:text-ink-black transition-all cursor-pointer"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-cream-surface rounded-xl flex flex-col gap-1">
                            <p className="font-bold text-ink-black">{selectedDoctor?.fullName}</p>
                            <p className="text-xs font-semibold text-cerulean-dark uppercase tracking-wide">
                                {selectedDoctor?.specialization}
                            </p>
                            <p className="text-xs text-ink-muted mt-1">
                                {selectedDoctor?.clinicName} · {selectedDoctor?.clinicCity}
                            </p>
                            <p className="text-xs font-semibold text-ink-charcoal mt-1">
                                Consultation Fee: ₹{selectedDoctor?.consultationFee}
                            </p>
                        </div>

                        {bookingError && (
                            <p className="text-sm text-red-600 font-semibold">{bookingError}</p>
                        )}

                        <p className="text-xs text-ink-muted">
                            Clicking "Request Consultation" will add you to this doctor's queue.
                            You'll receive a token number.
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-2.5 rounded-xl border-2 border-ink-black text-ink-black font-bold text-sm hover:bg-cream-surface transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmBook}
                                disabled={bookingLoading}
                                className="flex-1 py-2.5 rounded-xl border-2 border-ink-black bg-ink-black text-white font-bold text-sm hover:bg-white hover:text-ink-black transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {bookingLoading ? 'Submitting…' : 'Request Consultation'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BookAppointment;
