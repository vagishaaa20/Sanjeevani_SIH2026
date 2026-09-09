import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export const Sidebar = () => {
    const { user } = useAuth();

    if (!user) return null;

    const linksByRole = {
        admin: [
            { path: '/admin/clinics', label: '🏥 Clinic Approvals' },
            { path: '/admin/doctors', label: '🩺 Doctor Approvals' },
            { path: '/admin/health-workers', label: '🧑‍⚕️ Health Worker Approvals' },
        ],
        clinic_admin: [
            { path: '/clinic/profile', label: 'Clinic Setup' },
            { path: '/clinic/departments', label: 'OPD Departments' },
            { path: '/clinic/medicine-inventory', label: 'Medicine Inventory' },
            { path: '/clinic/referrals', label: 'Incoming Referrals' },
        ],
        doctor: [
            { path: '/doctor/dashboard', label: '🩺 Doctor Schedule' },
            { path: '/doctor/documents', label: '📄 My Documents' },
        ],
        patient: [
            { path: '/patient/dashboard', label: 'My Patient Care' },
            { path: '/patient/medicine-availability', label: 'Find Medicine' },
        ],
        health_worker: [
            { path: '/health-worker/dashboard', label: 'Dashboard' },
            { path: '/health-worker/profile', label: 'My Profile' },
            { path: '/health-worker/patients', label: 'My Patients' },
            { path: '/health-worker/referrals', label: 'Referrals' },
            { path: '/health-worker/followups', label: 'Follow-ups' },
        ],
    };

    const currentLinks = linksByRole[user.role] || [];

    return (
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r-2 border-ink-black p-6 flex flex-col gap-4">
            <div className="mb-2 hidden md:block">
                <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Navigation</h4>
            </div>
            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
                {currentLinks.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            `whitespace-nowrap px-4 py-2.5 rounded-xl border border-transparent font-semibold transition-all duration-150 flex-shrink-0 ${isActive
                                ? 'bg-cream-surface border-ink-black text-ink-black shadow-sm'
                                : 'text-ink-muted hover:text-ink-black hover:bg-cream-bg'
                            }`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
