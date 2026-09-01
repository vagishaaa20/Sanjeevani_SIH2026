import React from 'react';
import useAuth from '../../hooks/useAuth';
import DepartmentConfig from '../../components/clinic/DepartmentConfig';
import { Link } from 'react-router-dom';

export const DepartmentManager = () => {
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
            <div className="flex justify-between items-center bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-ink-black">OPD & Lab Departments</h2>
                    <p className="text-xs font-semibold text-ink-charcoal mt-1">Configure active services for {profile.clinicName}</p>
                </div>
                <Link
                    to="/clinic/profile"
                    className="px-4 py-2 text-xs font-bold text-ink-black bg-cream-surface border border-ink-black rounded-full hover:bg-ink-black hover:text-white transition duration-200"
                >
                    ← Back to Profile
                </Link>
            </div>

            <DepartmentConfig currentDepartments={profile.departments} />
        </div>
    );
};

export default DepartmentManager;
