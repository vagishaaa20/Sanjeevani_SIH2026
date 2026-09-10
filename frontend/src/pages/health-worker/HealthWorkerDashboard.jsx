import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ShieldAlert, HeartPulse, CheckCircle, Phone, MessageSquare, PlusCircle, ArrowRight } from 'lucide-react';
import healthWorkerService from '../../services/healthWorkerService';
import CareHeroBanner from '../../components/common/CareHeroBanner';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';

export const HealthWorkerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        healthWorkerService
            .getDashboard()
            .then((dashboardData) => setStats(dashboardData))
            .catch((err) => setError(err.response?.data?.error || 'Could not load dashboard'));
    }, []);

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            {/* Hero Care Banner */}
            <CareHeroBanner
                headline="Care. Connect. Heal."
                tagline="You are making a difference in someone's life today."
            />

            {error && (
                <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs">
                    {error}
                </div>
            )}

            {/* KPI Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="My Patients"
                    value={stats?.assignedPatients ?? '24'}
                    icon={Users}
                    variant="pink"
                    description="Active assignments"
                />
                <StatCard
                    title="High Risk Patients"
                    value={stats?.highRiskPatients ?? '5'}
                    icon={ShieldAlert}
                    variant="peach"
                    description="Need attention"
                />
                <StatCard
                    title="Pending Referrals"
                    value={stats?.pendingReferrals ?? '3'}
                    icon={HeartPulse}
                    variant="lavender"
                    description="Awaiting completion"
                />
                <StatCard
                    title="Follow-ups Due"
                    value={stats?.followupsDue ?? '7'}
                    icon={CheckCircle}
                    variant="mint"
                    description="This week"
                />
            </div>

            {/* 3-Column Layout: Upcoming Follow-ups, Recent Patients, Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Upcoming Follow-ups */}
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-black text-[#2d2329] font-heading">Upcoming Follow-ups</h3>
                            <Link to="/health-worker/followups" className="text-xs font-bold text-[#e13b68] hover:underline">
                                View all
                            </Link>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fdf5f7] border border-[#f8e7ee]">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#ffe6ee] flex items-center justify-center font-bold text-xs text-[#e13b68]">
                                        SD
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-black text-[#2d2329]">Savitri Devi</span>
                                        <span className="text-[11px] font-semibold text-[#7d6974]">Today, 11:00 AM</span>
                                    </div>
                                </div>
                                <Badge variant="pink">Due</Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fdf5f7] border border-[#f8e7ee]">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#e6f9f0] flex items-center justify-center font-bold text-xs text-[#10b981]">
                                        RK
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-black text-[#2d2329]">Ramesh Kumar</span>
                                        <span className="text-[11px] font-semibold text-[#7d6974]">Tomorrow, 10:30 AM</span>
                                    </div>
                                </div>
                                <Badge variant="pink">Due</Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fdf5f7] border border-[#f8e7ee]">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#f3e8ff] flex items-center justify-center font-bold text-xs text-[#7c3aed]">
                                        MK
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-black text-[#2d2329]">Meena Kumari</span>
                                        <span className="text-[11px] font-semibold text-[#7d6974]">06 May, 09:00 AM</span>
                                    </div>
                                </div>
                                <Badge variant="mint">Upcoming</Badge>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/health-worker/followups')}
                        className="w-full mt-4 py-3 bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-black rounded-2xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>+ Add Follow-up</span>
                    </button>
                </div>

                {/* 2. Recent Patients */}
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-black text-[#2d2329] font-heading">Recent Patients</h3>
                            <Link to="/health-worker/patients" className="text-xs font-bold text-[#e13b68] hover:underline">
                                View all
                            </Link>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link
                                to="/health-worker/patients"
                                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#f5e4ec] hover:bg-[#fdf0f4] transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#fff0e6] flex items-center justify-center font-bold text-xs text-[#e07a38]">
                                        RV
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-black text-[#2d2329]">Rahul Verma</span>
                                        <span className="text-[11px] font-bold text-[#e07a38]">High Risk</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#7d6974]" />
                            </Link>

                            <Link
                                to="/health-worker/patients"
                                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#f5e4ec] hover:bg-[#fdf0f4] transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#e6f9f0] flex items-center justify-center font-bold text-xs text-[#10b981]">
                                        AK
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-black text-[#2d2329]">Anita Kumari</span>
                                        <span className="text-[11px] font-bold text-[#10b981]">Normal</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#7d6974]" />
                            </Link>

                            <Link
                                to="/health-worker/patients"
                                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#f5e4ec] hover:bg-[#fdf0f4] transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#ffe6ee] flex items-center justify-center font-bold text-xs text-[#e13b68]">
                                        MS
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-black text-[#2d2329]">Mohan Singh</span>
                                        <span className="text-[11px] font-bold text-[#e13b68]">Low Risk</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#7d6974]" />
                            </Link>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/health-worker/patients')}
                        className="w-full mt-4 py-3 bg-[#fdf0f4] hover:bg-[#ffe6ee] text-[#e13b68] border border-[#f8c8d8] text-xs font-black rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>Manage All Patients</span>
                    </button>
                </div>

                {/* 3. Quick Actions */}
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
                    <h3 className="text-base font-black text-[#2d2329] font-heading">Quick Actions</h3>

                    {/* Quick Illustration Graphic */}
                    <div className="p-4 rounded-2xl bg-[#ffeff3] border border-[#f8d4e2] flex items-center justify-between">
                        <div className="flex flex-col text-left">
                            <span className="text-xs font-black text-[#2d2329]">Instant Patient Connect</span>
                            <span className="text-[11px] font-semibold text-[#7d6974]">Call or message assigned care list</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                    </div>

                    {/* 4 Action Buttons Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            to="/health-worker/patients"
                            className="p-3.5 rounded-2xl bg-white border border-[#f5e4ec] hover:bg-[#fdf0f4] hover:border-[#f8c8d8] transition flex items-center gap-2 text-xs font-bold text-[#2d2329]"
                        >
                            <Phone className="w-4 h-4 text-[#1e7ab8]" />
                            <span>Call Patient</span>
                        </Link>

                        <Link
                            to="/health-worker/patients"
                            className="p-3.5 rounded-2xl bg-white border border-[#f5e4ec] hover:bg-[#fdf0f4] hover:border-[#f8c8d8] transition flex items-center gap-2 text-xs font-bold text-[#2d2329]"
                        >
                            <MessageSquare className="w-4 h-4 text-[#25D366]" />
                            <span>Send Message</span>
                        </Link>

                        <Link
                            to="/health-worker/referrals"
                            className="p-3.5 rounded-2xl bg-white border border-[#f5e4ec] hover:bg-[#fdf0f4] hover:border-[#f8c8d8] transition flex items-center gap-2 text-xs font-bold text-[#2d2329]"
                        >
                            <HeartPulse className="w-4 h-4 text-[#7c3aed]" />
                            <span>Create Referral</span>
                        </Link>

                        <Link
                            to="/health-worker/followups"
                            className="p-3.5 rounded-2xl bg-white border border-[#f5e4ec] hover:bg-[#fdf0f4] hover:border-[#f8c8d8] transition flex items-center gap-2 text-xs font-bold text-[#2d2329]"
                        >
                            <PlusCircle className="w-4 h-4 text-[#e13b68]" />
                            <span>Add Follow-up</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthWorkerDashboard;