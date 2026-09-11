import React, { useState } from 'react';
import { Share2, Inbox, Send, ShieldAlert, HeartPulse, Stethoscope } from 'lucide-react';
import DoctorReferralForm from './DoctorReferralForm';
import DoctorIncomingReferrals from '../../components/doctor/DoctorIncomingReferrals';
import Badge from '../../components/common/Badge';

export const DoctorReferralsPage = () => {
    const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'create'

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            {/* Header */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#e13b68] bg-[#ffe6ee] px-2.5 py-0.5 rounded-full">
                            Clinical Referral Network
                        </span>
                        <Badge variant="mint" dot>
                            Live Sync
                        </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        Patient Referrals & Transfer Desk
                    </h1>
                    <p className="text-xs font-semibold text-[#7d6974] mt-1">
                        Review incoming community referrals from ASHA / ANM workers and create higher-center clinical referrals.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center p-1.5 bg-[#fffcfd] border border-[#f5e4ec] rounded-2xl self-start md:self-auto shadow-2xs">
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'incoming'
                                ? 'bg-[#e13b68] text-white shadow-xs'
                                : 'text-[#7d6974] hover:text-[#e13b68] hover:bg-[#ffe6ee]'
                        }`}
                    >
                        <Inbox className="w-4 h-4" />
                        <span>Incoming Community Referrals</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'create'
                                ? 'bg-[#e13b68] text-white shadow-xs'
                                : 'text-[#7d6974] hover:text-[#e13b68] hover:bg-[#ffe6ee]'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                        <span>Referral Poster (Create Referral)</span>
                    </button>
                </div>
            </div>

            {/* Tab Views */}
            {activeTab === 'incoming' ? (
                <div className="flex flex-col gap-6">
                    <DoctorIncomingReferrals />
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <DoctorReferralForm />
                </div>
            )}
        </div>
    );
};

export default DoctorReferralsPage;
