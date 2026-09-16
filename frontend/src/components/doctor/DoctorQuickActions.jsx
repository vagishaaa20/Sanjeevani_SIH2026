import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, FilePlus, ArrowUpRight, FolderCheck, Zap } from 'lucide-react';

export default function DoctorQuickActions({ onOpenReferralModal }) {
    const actions = [
        {
            title: 'Start Consultation',
            subtitle: 'Open waiting queue & take live calls',
            icon: Video,
            link: '/doctor/queue',
            btnText: 'Launch Queue',
            accent: 'bg-rose-50 border-rose-200 text-[#e13b68]',
            btnBg: 'bg-[#e13b68] text-white hover:bg-[#c92a55]',
        },
        {
            title: 'Incoming Referrals',
            subtitle: 'Review & respond to patient transfers',
            icon: ArrowUpRight,
            link: '#referrals-section',
            btnText: 'View Referrals',
            accent: 'bg-sky-50 border-sky-200 text-sky-600',
            btnBg: 'bg-sky-600 text-white hover:bg-sky-700',
        },
        {
            title: 'Create Referral',
            subtitle: 'Refer patient to specialist / facility',
            icon: FilePlus,
            onClick: onOpenReferralModal,
            btnText: 'New Referral',
            accent: 'bg-purple-50 border-purple-200 text-purple-600',
            btnBg: 'bg-purple-600 text-white hover:bg-purple-700',
        },
        {
            title: 'Manage Documents',
            subtitle: 'Upload licenses & medical credentials',
            icon: FolderCheck,
            link: '/doctor/documents',
            btnText: 'Credentials',
            accent: 'bg-emerald-50 border-emerald-200 text-emerald-600',
            btnBg: 'bg-emerald-600 text-white hover:bg-emerald-700',
        },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col gap-4"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-[#2d2329] uppercase tracking-wider font-heading">
                        Quick Actions
                    </h3>
                    <p className="text-[11px] font-semibold text-[#7d6974]">Direct access to primary clinical tools</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
                {actions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <motion.div
                            key={action.title}
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                            className="p-5 rounded-2xl border border-[#f5e4ec] bg-stone-50/30 hover:bg-white transition-all flex flex-col justify-between gap-4 shadow-2xs"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`w-10 h-10 rounded-xl ${action.accent} border flex items-center justify-center`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-[#2d2329] text-sm">{action.title}</h4>
                                <p className="text-[11px] font-medium text-[#7d6974] mt-1 leading-snug">
                                    {action.subtitle}
                                </p>
                            </div>

                            {action.link ? (
                                action.link.startsWith('#') ? (
                                    <a
                                        href={action.link}
                                        className={`w-full py-2 rounded-xl ${action.btnBg} text-xs font-bold text-center transition-all shadow-2xs block`}
                                    >
                                        {action.btnText}
                                    </a>
                                ) : (
                                    <Link
                                        to={action.link}
                                        className={`w-full py-2 rounded-xl ${action.btnBg} text-xs font-bold text-center transition-all shadow-2xs block`}
                                    >
                                        {action.btnText}
                                    </Link>
                                )
                            ) : (
                                <button
                                    onClick={action.onClick}
                                    className={`w-full py-2 rounded-xl ${action.btnBg} text-xs font-bold transition-all shadow-2xs cursor-pointer`}
                                >
                                    {action.btnText}
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
