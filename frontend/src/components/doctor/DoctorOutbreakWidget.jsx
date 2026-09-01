import React, { useEffect, useState, useContext } from 'react';
import { outbreakService } from '../../services/outbreakService';
import { SocketContext } from '../../context/SocketContext';
import { Link } from 'react-router-dom';

// Note: In an ideal scenario this maps exactly to doctor city. For demo, we just show top 3 nationwide.
const DoctorOutbreakWidget = () => {
    const [alerts, setAlerts] = useState([]);
    const { socket } = useContext(SocketContext);

    useEffect(() => {
        outbreakService.getActiveAlerts().then(res => {
            const sorted = res.alerts.sort((a, b) => b.caseCount - a.caseCount).slice(0, 3);
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
                    next[idx] = { ...next[idx], riskLevel: payload.riskLevel, caseCount: payload.caseCount };
                } else if (next.length < 3) {
                    next.push(payload);
                }
                return next.sort((a, b) => b.caseCount - a.caseCount).slice(0, 3);
            });
        });
        socket.on('outbreak:resolved', (payload) => {
            setAlerts(prev => prev.filter(a => a.id !== payload.id));
        });
        return () => {
            socket.off('outbreak:update');
            socket.off('outbreak:resolved');
        }
    }, [socket]);

    if (alerts.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border-2 border-red-300 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h3 className="font-black text-red-900 text-sm tracking-wide uppercase">Active Regional Outbreaks</h3>
            </div>
            <div className="flex flex-col gap-2">
                {alerts.map(a => (
                    <div key={a.id} className="flex justify-between items-center text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                        <span className="text-red-900">{a.diseaseCategory}</span>
                        <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-black text-white
                                ${a.riskLevel === 'severe' ? 'bg-red-500' : a.riskLevel === 'moderate' ? 'bg-orange-500' : 'bg-amber-400'}`}>
                                {a.riskLevel}
                            </span>
                            <span className="text-red-700 bg-red-200 px-1.5 py-0.5 rounded font-black">{a.caseCount} cases</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DoctorOutbreakWidget;
