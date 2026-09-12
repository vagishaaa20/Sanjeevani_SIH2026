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
                    className="font-semibold text-sm flex items-center gap-1 cursor-pointer transition-colors hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>Book an Appointment</h2>
            </div>

            {/* Status messages */}
            {geoLoading && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Getting your location…</p>
            )}
            {permissionDenied && (
                <div
                    className="p-4 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                >
                    Location access denied. Enable location permission to see nearby doctors.
                </div>
            )}
            {doctorsLoading && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Finding doctors near you…</p>
            )}
            {doctorsError && (
                <p className="text-sm" style={{ color: 'var(--accent)' }}>{doctorsError}</p>
            )}

            {!doctorsLoading && !doctorsError && coords && doctors.length === 0 && (
                <div
                    className="p-6 rounded-2xl text-center text-sm"
                    style={{ background: 'var(--card-bg)', border: '2px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                    No verified doctors found nearby. Try increasing the search radius.
                </div>
            )}

            {/* Doctor list */}
            {doctors.length > 0 && (
                <div
                    className="rounded-2xl p-6 flex flex-col gap-4 shadow-xs"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <h3 className="text-lg font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
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
                        <div
                            className="p-4 rounded-xl"
                            style={{ background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-text)' }}
                        >
                            <p className="font-bold text-sm" style={{ color: 'var(--pastel-mint-text)' }}>
                                ✓ You're in the queue — Token #{bookingSuccess.queue?.tokenNumber}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--pastel-mint-text)' }}>
                                Your consultation request with {selectedDoctor?.fullName} has been submitted.
                                Please arrive on time.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-white"
                            style={{ background: 'var(--accent)' }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 rounded-xl flex flex-col gap-1" style={{ background: 'var(--bg-surface)' }}>
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedDoctor?.fullName}</p>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                                {selectedDoctor?.specialization}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {selectedDoctor?.clinicName} · {selectedDoctor?.clinicCity}
                            </p>
                            <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Consultation Fee: ₹{selectedDoctor?.consultationFee}
                            </p>
                        </div>

                        {bookingError && (
                            <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{bookingError}</p>
                        )}

                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Clicking "Request Consultation" will add you to this doctor's queue.
                            You'll receive a token number.
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer hover:opacity-80"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmBook}
                                disabled={bookingLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 text-white"
                                style={{ background: 'var(--accent)' }}
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
