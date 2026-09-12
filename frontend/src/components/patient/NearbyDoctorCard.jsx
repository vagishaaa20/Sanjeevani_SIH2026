import React from 'react';
import { MapPin, Building, Clock } from 'lucide-react';

/**
 * Reusable doctor card used on both PatientDashboard (read-only)
 * and BookAppointment page (with Book button).
 *
 * Props:
 *   doctor  — doctor object from GET /api/doctors/nearby
 *   onBook  — optional callback(doctor); when provided renders a "Book" button
 */
const NearbyDoctorCard = ({ doctor, onBook, hasActiveQueue }) => {
    return (
        <div
            className="rounded-xl p-4 flex flex-col gap-2 transition-colors"
            style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}
        >
            <div className="flex justify-between items-start gap-2">
                <div>
                    <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{doctor.fullName}</h4>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                        {doctor.specialization}
                        {doctor.subSpecialization ? ` • ${doctor.subSpecialization}` : ''}
                    </p>
                </div>
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {Number(doctor.distanceKm).toFixed(1)} km
                </span>
            </div>

            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Practice: {doctor.clinicName}</p>
                <p>{doctor.clinicAddress}, {doctor.clinicCity}</p>
            </div>

            <div
                className="flex justify-between items-center mt-1 pt-2 text-xs"
                style={{ borderTop: '1px solid var(--border)' }}
            >
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Fee: ₹{doctor.consultationFee}</span>
                {doctor.yearsOfExperience && (
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {doctor.yearsOfExperience} yrs exp
                    </span>
                )}
            </div>

            {onBook && (
                <button
                    type="button"
                    onClick={() => onBook(doctor)}
                    disabled={hasActiveQueue}
                    title={hasActiveQueue ? "You already have an active request — cancel it to book with a different doctor" : undefined}
                    className="mt-1 w-full py-2 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{ background: 'var(--accent)' }}
                >
                    Book Consultation
                </button>
            )}
        </div>
    );
};

export default NearbyDoctorCard;
