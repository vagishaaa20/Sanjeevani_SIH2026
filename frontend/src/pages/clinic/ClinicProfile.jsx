import React from 'react';
import useAuth from '../../hooks/useAuth';
import ClinicVerificationBadge from '../../components/clinic/ClinicVerificationBadge';
import { Link } from 'react-router-dom';

export const ClinicProfile = () => {
    const { user } = useAuth();

    if (!user || user.role !== 'clinic_admin') {
        return (
            <div className="p-6 text-center font-bold text-red-500">
                Access Denied. Only Clinic Administrator Role authorized.
            </div>
        );
    }

    const profile = user.profile || {};

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-sm">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black text-ink-black">{profile.clinicName || 'Clinic Name'}</h2>
                        <ClinicVerificationBadge status={profile.verificationStatus} />
                    </div>
                    <p className="text-sm font-semibold text-ink-charcoal">License Detail: {profile.licenseNumber}</p>
                </div>
                <div>
                    <Link
                        to="/clinic/departments"
                        className="px-6 py-3 font-semibold rounded-full border border-ink-black bg-pastel-pink-action text-white hover:bg-pastel-pink-action-hover transition shadow-sm cursor-pointer inline-block text-center"
                    >
                        Configure Departments
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-ink-black">Facility Location</h3>
                    <div className="flex flex-col gap-3">
                        <div>
                            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">City</span>
                            <p className="font-semibold text-ink-black">{profile.city || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">Physical Address</span>
                            <p className="font-semibold text-ink-black">{profile.address || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">Latitude</span>
                                <p className="font-semibold text-ink-black">{profile.latitude || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">Longitude</span>
                                <p className="font-semibold text-ink-black">{profile.longitude || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-ink-black">Active Departments</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.departments && profile.departments.length > 0 ? (
                            profile.departments.map((dept) => (
                                <span
                                    key={dept}
                                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-ink-black bg-cream-surface text-ink-charcoal"
                                >
                                    {dept}
                                </span>
                            ))
                        ) : (
                            <p className="text-sm font-semibold text-ink-muted">No operational departments configured yet. Click "Configure Departments" to set them up.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicProfile;
