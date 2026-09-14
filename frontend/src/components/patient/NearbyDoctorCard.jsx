import React from 'react';
import { MapPin, Building2, Clock, Calendar, Star, Stethoscope } from 'lucide-react';

/**
 * Reusable doctor card used on PatientDashboard and BookAppointment page.
 *
 * Props:
 *   doctor       — doctor object from GET /api/doctors/nearby
 *   onBook       — optional callback(doctor); when provided renders a "Book Clinic Visit" button
 *   bookingType  — 'clinic_visit' | 'teleconsultation'
 */
const NearbyDoctorCard = ({ doctor, onBook, bookingType = 'clinic_visit' }) => {
    const clinicAddress = [
        doctor.clinicName || doctor.clinicOrHospital || 'Consultation Clinic',
        doctor.clinicAddress || doctor.address,
        doctor.clinicCity || doctor.city,
        doctor.state,
        doctor.pincode ? `PIN: ${doctor.pincode}` : null
    ].filter(Boolean).join(', ');

    return (
        <div
            className="rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 shadow-2xs hover:shadow-xs"
            style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}
        >
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-3">
                        <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            {doctor.fullName ? doctor.fullName.replace(/^Dr\.\s*/i, '').charAt(0).toUpperCase() : 'D'}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                                    {doctor.fullName.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`}
                                </h4>
                                {doctor.avgRating && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                        {doctor.avgRating}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--accent)' }}>
                                {doctor.specialization || 'General Physician'}
                                {doctor.subSpecialization ? ` · ${doctor.subSpecialization}` : ''}
                            </p>
                        </div>
                    </div>

                    {doctor.distanceKm !== undefined && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <span>{Number(doctor.distanceKm).toFixed(1)} km</span>
                        </span>
                    )}
                </div>

                {/* Clinic details */}
                <div
                    className="p-3 rounded-xl text-xs flex flex-col gap-1"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                    <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                        <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                        <span className="truncate">{doctor.clinicName || doctor.clinicOrHospital || 'Independent Clinic Practice'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {clinicAddress}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>In-Person Fee</span>
                        <span className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                            ₹{doctor.consultationFee || 500}
                        </span>
                    </div>

                    {doctor.yearsOfExperience !== undefined && (
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            {doctor.yearsOfExperience} yrs experience
                        </span>
                    )}
                </div>

                {onBook && (
                    <button
                        type="button"
                        onClick={() => onBook(doctor)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-white shadow-xs hover:shadow-sm"
                        style={{ background: 'var(--accent)' }}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Select Doctor &amp; Choose Timing</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default NearbyDoctorCard;
