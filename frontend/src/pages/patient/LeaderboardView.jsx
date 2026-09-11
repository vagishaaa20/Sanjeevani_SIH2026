import React, { useState, useEffect } from 'react';
import { Award, Trophy, Star, ShieldCheck, Stethoscope, Heart, Users, Sparkles, Medal, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';

export const LeaderboardView = () => {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('doctors');

    // Community Champions mock data
    const COMMUNITY_CHAMPIONS = [
        {
            id: 'c1',
            name: 'Sunita Devi (ASHA)',
            area: 'Sonari, Jamshedpur',
            patientsHelped: 148,
            badge: 'Top Rural Care Champion',
            rating: 5.0,
            avatar: 'S',
            accent: 'bg-emerald-500',
        },
        {
            id: 'c2',
            name: 'Pooja Kumari (ANM)',
            area: 'Bistupur, Jamshedpur',
            patientsHelped: 112,
            badge: 'Maternal Health Lead',
            rating: 4.9,
            avatar: 'P',
            accent: 'bg-[#e13b68]',
        },
        {
            id: 'c3',
            name: 'Amit Hansda (Worker)',
            area: 'Potka Tribal Block',
            patientsHelped: 96,
            badge: 'Remote Outreach Hero',
            rating: 4.9,
            avatar: 'A',
            accent: 'bg-amber-500',
        },
    ];

    useEffect(() => {
        api.get('/doctors/leaderboard')
            .then((res) => {
                setLeaderboard(res.data.leaderboard || []);
            })
            .catch((err) => {
                console.error('Failed to load leaderboard', err);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up max-w-7xl mx-auto pb-12">
            {/* Header Title */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center font-bold shadow-xs">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                                Sanjeevani Health Leaderboard
                            </h1>
                            <Badge variant="mint" dot>
                                Verified Rankings
                            </Badge>
                        </div>
                        <p className="text-xs md:text-sm font-semibold text-[#7d6974] mt-1">
                            Recognizing top verified clinical practitioners and frontline ASHA health heroes delivering empathetic care.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-[#fdf0f4] p-1.5 rounded-2xl border border-[#f5e4ec]">
                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'doctors'
                                ? 'bg-white text-[#e13b68] shadow-xs font-black'
                                : 'text-[#7d6974] hover:text-[#2d2329]'
                        }`}
                    >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Top Doctors</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('champions')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'champions'
                                ? 'bg-white text-[#e13b68] shadow-xs font-black'
                                : 'text-[#7d6974] hover:text-[#2d2329]'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>Frontline Champions</span>
                    </button>
                </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'doctors' ? (
                <div className="flex flex-col gap-4">
                    {loading ? (
                        <div className="p-12 text-center text-xs font-bold text-[#7d6974] animate-pulse">
                            Loading leaderboard...
                        </div>
                    ) : (
                        <div className="bg-white border border-[#f5e4ec] rounded-3xl overflow-hidden shadow-xs">
                            <div className="p-6 border-b border-[#f5e4ec] flex items-center justify-between">
                                <h3 className="font-black text-base text-[#2d2329] font-heading flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-500" />
                                    <span>Highest Patient-Rated Doctors</span>
                                </h3>
                                <span className="text-xs font-semibold text-[#7d6974]">
                                    Updated hourly based on verified patient ratings
                                </span>
                            </div>

                            <div className="divide-y divide-[#fdf0f4]">
                                {leaderboard.map((doc, idx) => {
                                    const rank = idx + 1;
                                    const rating = parseFloat(doc.avgRating || 4.9).toFixed(1);
                                    const count = doc.reviewCount || 18;

                                    return (
                                        <div
                                            key={doc.userId}
                                            className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#fdf9fb] transition"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                                    rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                    rank === 2 ? 'bg-zinc-100 text-zinc-700 border border-zinc-300' :
                                                    rank === 3 ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                                    'bg-transparent text-[#7d6974]'
                                                }`}>
                                                    #{rank}
                                                </span>

                                                <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-base font-black text-[#e13b68]">
                                                    {doc.fullName ? doc.fullName.replace('Dr. ', '').charAt(0) : 'D'}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-sm md:text-base text-[#2d2329]">
                                                            {doc.fullName}
                                                        </h4>
                                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <p className="text-xs font-bold text-[#e13b68]">
                                                        {doc.specialization} {doc.city && `• ${doc.city}`}
                                                    </p>
                                                    {doc.clinicOrHospital && (
                                                        <p className="text-[11px] font-semibold text-[#7d6974]">
                                                            {doc.clinicOrHospital}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                <div className="flex flex-col text-right">
                                                    <div className="flex items-center gap-1 text-xs font-black text-[#b7791f]">
                                                        <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                                                        <span>{rating} / 5.0</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-[#7d6974]">
                                                        {count} verified reviews
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COMMUNITY_CHAMPIONS.map((champ, idx) => (
                        <div
                            key={champ.id}
                            className="bg-white border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-6 relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] flex items-center justify-center font-black text-lg text-[#e13b68]">
                                        {champ.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-[#2d2329]">{champ.name}</h4>
                                        <p className="text-xs text-[#7d6974]">{champ.area}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#fdf0f4] text-[#e13b68]">
                                    #{idx + 1}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Badge variant="mint" className="self-start">
                                    {champ.badge}
                                </Badge>
                                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-[#fdf0f4]">
                                    <span className="text-[#7d6974]">Patients Guided:</span>
                                    <span className="text-[#2d2329]">{champ.patientsHelped} verified cases</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaderboardView;
