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
            <div
                className="rounded-3xl p-6 shadow-xs flex flex-col gap-4"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            <Activity className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-sm font-heading" style={{ color: 'var(--text-primary)' }}>Epidemic Surveillance</h3>
                    </div>
                    <Badge variant="mint" dot>
                        All Quiet
                    </Badge>
                </div>
                <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    No active high-risk disease outbreak clusters detected in your regional surveillance zone.
                </p>
                <Link
                    to="/doctor/heatmap"
                    className="mt-1 text-xs font-bold flex items-center gap-1.5 transition"
                    style={{ color: 'var(--accent)' }}
                >
                    <span>View Nationwide Heatmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    return (
        <div
            className="rounded-3xl p-6 shadow-xs flex flex-col gap-4"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm font-heading" style={{ color: 'var(--text-primary)' }}>Active Outbreaks</h3>
                        <p className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Regional surveillance alerts</p>
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
                            className="flex flex-col gap-2 p-3.5 rounded-2xl transition shadow-2xs"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{a.diseaseCategory}</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider ${
                                        isSevere
                                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                            : isModerate
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                    }`}
                                >
                                    {a.riskLevel}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                <span className="flex items-center gap-1 font-medium">
                                    <MapPin className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                                    <span>{a.region || a.district || 'Regional Hub'}</span>
                                </span>
                                <span
                                    className="font-bold px-2 py-0.5 rounded-md text-[10px]"
                                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                >
                                    {a.confirmedCount || 0} conf. / {a.reportedCount || 0} rep.
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Link
                to="/doctor/heatmap"
                className="mt-1 pt-3 text-xs font-bold flex items-center justify-between transition group"
                style={{ borderTop: '1px solid var(--border)', color: 'var(--accent)' }}
            >
                <span>View Full Epidemic Heatmap</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
};

export default DoctorOutbreakWidget;
