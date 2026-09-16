import React from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, FileText, CalendarClock } from 'lucide-react';

export default function DoctorStatsGrid({
    totalPatients = 128,
    highRiskPatients = 4,
    pendingReferrals = 3,
    followupsDue = 6,
}) {
    const stats = [
        {
            id: 'patients',
            label: 'My Patients',
            value: totalPatients,
            subtitle: 'Total registered patients',
            icon: Users,
            iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            badge: '+12% this month',
            badgeBg: 'bg-emerald-100 text-emerald-800',
        },
        {
            id: 'high-risk',
            label: 'High Risk Patients',
            value: highRiskPatients,
            subtitle: 'Require priority care',
            icon: AlertTriangle,
            iconBg: 'bg-rose-50 text-[#e13b68] border-rose-100',
            badge: 'Action required',
            badgeBg: 'bg-rose-100 text-[#e13b68]',
            pulse: true,
        },
        {
            id: 'referrals',
            label: 'Pending Referrals',
            value: pendingReferrals,
            subtitle: 'Incoming requests',
            icon: FileText,
            iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
            badge: 'New today',
            badgeBg: 'bg-sky-100 text-sky-800',
        },
        {
            id: 'followups',
            label: 'Follow-ups Due',
            value: followupsDue,
            subtitle: 'Scheduled for today',
            icon: CalendarClock,
            iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
            badge: 'Today',
            badgeBg: 'bg-purple-100 text-purple-800',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.08 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4 transition-all relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} border flex items-center justify-center relative`}>
                                <Icon className="w-6 h-6" />
                                {stat.pulse && (
                                    <motion.span
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-[#e13b68] rounded-full"
                                    />
                                )}
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${stat.badgeBg}`}>
                                {stat.badge}
                            </span>
                        </div>

                        <div>
                            <h4 className="text-2xl md:text-3xl font-black text-[#2d2329] tracking-tight font-heading">
                                {stat.value}
                            </h4>
                            <p className="text-xs font-bold text-[#2d2329] mt-0.5">{stat.label}</p>
                            <p className="text-[11px] font-medium text-[#7d6974] mt-0.5">{stat.subtitle}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
