import React from 'react';

/**
 * Reusable doctor card used on both PatientDashboard (read-only)
 * and BookAppointment page (with Book button).
 *
 * Props:
 *   doctor  — doctor object from GET /api/doctors/nearby
 *   onBook  — optional callback(doctor); when provided renders a "Book" button
 */
const NearbyDoctorCard = ({ doctor, onBook }) => {
    return (
        <div className="border-2 border-ink-black rounded-xl p-4 flex flex-col gap-2 hover:bg-neutral-50 transition-colors">
            <div className="flex justify-between items-start gap-2">
                <div>
                    <h4 className="font-bold text-ink-black">{doctor.fullName}</h4>
                    <p className="text-xs font-semibold text-cerulean-dark uppercase tracking-wide">
                        {doctor.specialization}
                        {doctor.subSpecialization ? ` • ${doctor.subSpecialization}` : ''}
                    </p>
                </div>
                <span className="text-xs font-semibold text-cerulean-dark whitespace-nowrap">
                    {Number(doctor.distanceKm).toFixed(1)} km
                </span>
            </div>

            <div className="text-xs text-ink-muted">
                <p className="font-semibold text-ink-black">Practice: {doctor.clinicName}</p>
                <p>{doctor.clinicAddress}, {doctor.clinicCity}</p>
            </div>

            <div className="flex justify-between items-center mt-1 border-t border-zinc-200 pt-2 text-xs">
                <span className="text-ink-charcoal font-medium">Fee: ₹{doctor.consultationFee}</span>
                {doctor.yearsOfExperience && (
                    <span className="text-ink-charcoal font-medium">
                        {doctor.yearsOfExperience} yrs exp
                    </span>
                )}
            </div>

            {onBook && (
                <button
                    type="button"
                    onClick={() => onBook(doctor)}
                    className="mt-1 w-full py-2 rounded-xl border-2 border-ink-black bg-ink-black text-white text-sm font-bold hover:bg-white hover:text-ink-black transition-all duration-150 cursor-pointer"
                >
                    Book Consultation
                </button>
            )}
        </div>
    );
};

export default NearbyDoctorCard;
