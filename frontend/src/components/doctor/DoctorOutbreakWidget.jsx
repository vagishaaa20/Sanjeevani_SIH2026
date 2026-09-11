import React, { useEffect, useState, useContext } from 'react';
import { outbreakService } from '../../services/outbreakService';
import { SocketContext } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import { Flame, ShieldAlert, ArrowRight, Activity, MapPin } from 'lucide-react';
import Badge from '../common/Badge';

const DoctorOutbreakWidget = () => {
    const [alerts, setAlerts] = useState([]);
    const { socket } = useContext(SocketContext);

    useEffect(() => {
        outbreakService.getActiveAlerts().then(res => {
            const sorted = (res.alerts || []).sort((a, b) => (b.confirmedCount - a.confirmedCount) || (b.reportedCount - a.reportedCount)).slice(0, 3);
            setAlerts(sorted);
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('outbreak:update', (payload) => {
            setAlerts(prev => {
                const next = [...prev];
                const idx = next.findIndex(a => a.id === payload.id);
                if (idx >= 0) {
                    next[idx] = { ...next[idx], riskLevel: payload.riskLevel, reportedCount: payload.reportedCount, confirmedCount: payload.confirmedCount };
                } else if (next.length < 3) {
                    next.push(payload);
                }
                return next.sort((a, b) => (b.confirmedCount - a.confirmedCount) || (b.reportedCount - a.reportedCount)).slice(0, 3);
            });
        });
        socket.on('outbreak:resolved', (payload) => {
            setAlerts(prev => prev.filter(a => a.id !== payload.id));
        });
        return () => {
            socket.off('outbreak:update');
            socket.off('outbreak:resolved');
        };
    }, [socket]);

    if (alerts.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-[#f5e4ec] p-6 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                            <Activity className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-[#2d2329] text-sm font-heading">Epidemic Surveillance</h3>
                    </div>
                    <Badge variant="mint" dot>
                        All Quiet
                    </Badge>
                </div>
                <p className="text-xs text-[#7d6974] font-medium leading-relaxed">
                    No active high-risk disease outbreak clusters detected in your regional surveillance zone.
                </p>
                <Link
                    to="/doctor/heatmap"
                    className="mt-1 text-xs font-bold text-[#e13b68] hover:text-[#c92a55] flex items-center gap-1.5 transition"
                >
                    <span>View Nationwide Heatmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-[#f5e4ec] p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-black text-[#2d2329] text-sm font-heading">Active Outbreaks</h3>
                        <p className="text-[10px] text-[#7d6974] font-semibold">Regional surveillance alerts</p>
                    </div>
                </div>
                <Badge variant="pink" pulse>
                    Live Alert
                </Badge>
            </div>

            <div className="flex flex-col gap-2.5">
                {alerts.map(a => {
                    const isSevere = a.riskLevel === 'severe';
                    const isModerate = a.riskLevel === 'moderate';

                    return (
                        <div
                            key={a.id}
                            className="flex flex-col gap-2 bg-[#fffcfd] p-3.5 rounded-2xl border border-[#f5e4ec] hover:border-[#f5c6d6] transition shadow-2xs"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-[#2d2329]">{a.diseaseCategory}</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider ${
                                        isSevere
                                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                            : isModerate
                                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                >
                                    {a.riskLevel}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-[#7d6974] pt-1 border-t border-[#f5e4ec]/60">
                                <span className="flex items-center gap-1 font-medium">
                                    <MapPin className="w-3 h-3 text-[#e13b68]" />
                                    <span>{a.region || a.district || 'Regional Hub'}</span>
                                </span>
                                <span className="font-bold text-[#8e1d41] bg-[#ffe6ee] px-2 py-0.5 rounded-md text-[10px]">
                                    {a.confirmedCount || 0} conf. / {a.reportedCount || 0} rep.
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Link
                to="/doctor/heatmap"
                className="mt-1 pt-3 border-t border-[#f5e4ec] text-xs font-bold text-[#e13b68] hover:text-[#c92a55] flex items-center justify-between transition group"
            >
                <span>View Full Epidemic Heatmap</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
};

export default DoctorOutbreakWidget;
