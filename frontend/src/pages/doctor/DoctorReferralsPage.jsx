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
            <div 
                className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span 
                            className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            Clinical Referral Network
                        </span>
                        <Badge variant="mint" dot>
                            Live Sync
                        </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black font-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Patient Referrals &amp; Transfer Desk
                    </h1>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Review incoming community referrals from ASHA / ANM workers and create higher-center clinical referrals.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div 
                    className="flex items-center p-1.5 rounded-2xl self-start md:self-auto shadow-2xs"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={activeTab === 'incoming' ? {
                            background: 'var(--accent)',
                            color: '#ffffff',
                            boxShadow: '0 2px 8px rgba(225,59,104,0.3)',
                        } : {
                            color: 'var(--text-secondary)'
                        }}
                    >
                        <Inbox className="w-4 h-4" />
                        <span>Incoming Community Referrals</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={activeTab === 'create' ? {
                            background: 'var(--accent)',
                            color: '#ffffff',
                            boxShadow: '0 2px 8px rgba(225,59,104,0.3)',
                        } : {
                            color: 'var(--text-secondary)'
                        }}
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
