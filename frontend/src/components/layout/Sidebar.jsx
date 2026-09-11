import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    HeartPulse,
    Search,
    CheckCircle,
    Bell,
    BarChart3,
    HelpCircle,
    Settings,
    Heart,
    ChevronDown,
    Building,
    Stethoscope,
    ClipboardList,
    Pill,
    FileText,
    Flame,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export const Sidebar = () => {
    const { user } = useAuth();

    if (!user) return null;

    const linksByRole = {
        admin: [
            { path: '/admin/clinics', label: 'Clinic Approvals', icon: Building },
            { path: '/admin/doctors', label: 'Doctor Approvals', icon: Stethoscope },
            { path: '/admin/health-workers', label: 'Health Worker Approvals', icon: Users },
        ],
        clinic_admin: [
            { path: '/clinic/profile', label: 'Clinic Setup', icon: Building },
            { path: '/clinic/departments', label: 'OPD Departments', icon: ClipboardList },
            { path: '/clinic/medicine-inventory', label: 'Medicine Inventory', icon: Pill },
            { path: '/clinic/referrals', label: 'Incoming Referrals', icon: HeartPulse },
        ],
        doctor: [
            { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/doctor/profile', label: 'Doctor Profile & Stats', icon: Users },
            { path: '/doctor/clinics', label: 'Practice Locations', icon: Building },
            { path: '/doctor/referrals', label: 'Patient Referrals', icon: HeartPulse },
            { path: '/doctor/leaderboard', label: 'Health Champions', icon: BarChart3 },
            { path: '/doctor/heatmap', label: 'Epidemic Heatmap', icon: Flame },
        ],
        patient: [
            { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/patient/ai-triage', label: 'AI Clinical Triage', icon: Stethoscope },
            { path: '/patient/doctors', label: 'Find Doctors & Reviews', icon: Search },
            { path: '/patient/leaderboard', label: 'Health Champions', icon: BarChart3 },
            { path: '/patient/heatmap', label: 'Epidemic Heatmap', icon: Flame },
            { path: '/patient/consultations', label: 'My Consultations', icon: Calendar },
            { path: '/patient/medicine-availability', label: 'Find Medicines', icon: Pill },
            { path: '/patient/subsidy', label: 'Subsidy & Assistance', icon: HeartPulse },
            { path: '/patient/profile', label: 'My Profile & ABHA', icon: Users },
        ],
        health_worker: [
            { path: '/health-worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/health-worker/patients', label: 'My Patients', icon: Users },
            { path: '/health-worker/followups', label: 'Follow-ups', icon: CheckCircle },
            { path: '/health-worker/referrals', label: 'Referrals', icon: HeartPulse },
            { path: '/health-worker/profile', label: 'Settings', icon: Settings },
        ],
    };

    const currentLinks = linksByRole[user.role] || [];
    const profile = user.profile || {};
    const userName = profile.fullName || user.email?.split('@')[0] || user.phone || 'User';

    return (
        <aside className="w-full md:w-64 bg-[#fdf0f4] border-b md:border-b-0 md:border-r border-[#f3dce5] p-5 flex flex-col justify-between min-h-[calc(100vh-61px)]">
            <div className="flex flex-col gap-6">
                {/* Brand Logo in Sidebar (Desktop) */}
                <div className="hidden md:flex flex-col items-start gap-1 pb-4 border-b border-[#f3dce5]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68] shadow-xs">
                            <Heart className="w-4 h-4 fill-[#e13b68]" />
                        </div>
                        <span className="text-xl font-black text-[#2d2329] font-heading tracking-tight">
                            Sanjeevani
                        </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#7d6974] pl-10 -mt-1">
                        Health for All
                    </span>
                </div>

                {/* Navigation Menu */}
                <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                    {currentLinks.map((link) => {
                        const IconComponent = link.icon;
                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `whitespace-nowrap px-4 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all duration-150 flex items-center gap-3 flex-shrink-0 ${isActive
                                        ? 'bg-[#ffe6ee] text-[#e13b68] shadow-xs font-black'
                                        : 'text-[#4a3c45] hover:text-[#e13b68] hover:bg-white/60'
                                    }`
                                }
                            >
                                {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
                                <span>{link.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom User Profile Card */}
            <div className="hidden md:flex items-center justify-between p-3 rounded-2xl bg-white border border-[#f5e4ec] shadow-xs mt-6">
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-9 h-9 rounded-full bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-xs font-black text-[#e13b68] flex-shrink-0">
                        {(userName || 'U').charAt(0)}
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-xs font-black text-[#2d2329] truncate">{userName}</span>
                        <span className="text-[10px] font-bold text-[#7d6974] capitalize truncate">
                            {user.role?.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#7d6974] flex-shrink-0" />
            </div>
        </aside>
    );
};

export default Sidebar;
