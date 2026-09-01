import React, { useEffect, useState, useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { outbreakService } from '../../services/outbreakService';

// Fallback precautions if you prefer not to implement Gemini-per-disease here initially
const PRECAUTIONS = {
    'Fever/Infectious': 'Clear stagnant water, use mosquito nets, and stay hydrated. See a doctor if fever persists over 48 hours.',
    'Respiratory': 'Wear a mask in crowded areas, wash hands frequently, and avoid close contact with sick individuals.',
    'Gastrointestinal': 'Drink boiled or filtered water, eat freshly cooked food, and wash hands thoroughly before meals.',
    'Other': 'Maintain standard hygiene practices and consult a physician if you develop any severe symptoms.'
};

const OutbreakBanner = ({ userRegionGeohash }) => {
    const { socket, connected } = useContext(SocketContext);
    const [alerts, setAlerts] = useState([]);
    const [dismissed, setDismissed] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dismissedOutbreaks') || '[]');
        } catch { return []; }
    });

    useEffect(() => {
        // Fetch active alerts on mount to see if there's any matching user's region
        outbreakService.getActiveAlerts().then(res => {
            const matches = res.alerts.filter(a =>
                a.geohash === userRegionGeohash &&
                (a.riskLevel === 'severe' || a.riskLevel === 'moderate')
            );
            setAlerts(matches);
        }).catch(err => console.error('Failed to load alerts for banner', err));
    }, [userRegionGeohash]);

    useEffect(() => {
        if (!socket) return;

        socket.on('outbreak:update', (payload) => {
            if (payload.geohash === userRegionGeohash && (payload.riskLevel === 'severe' || payload.riskLevel === 'moderate')) {
                setAlerts(prev => {
                    const exists = prev.find(a => a.id === payload.id);
                    if (exists) {
                        return prev.map(a => a.id === payload.id ? { ...a, riskLevel: payload.riskLevel } : a);
                    }
                    return [{ ...payload, id: payload.id, riskLevel: payload.riskLevel }, ...prev];
                });
            }
        });

        socket.on('outbreak:resolved', (payload) => {
            setAlerts(prev => prev.filter(a => a.id !== payload.id));
        });

        return () => {
            socket.off('outbreak:update');
            socket.off('outbreak:resolved');
        };
    }, [socket, userRegionGeohash]);

    const handleDismiss = (id) => {
        const newDismissed = [...dismissed, id];
        setDismissed(newDismissed);
        localStorage.setItem('dismissedOutbreaks', JSON.stringify(newDismissed));
    };

    const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

    if (visibleAlerts.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 mb-6">
            {visibleAlerts.map(alert => {
                const isSevere = alert.riskLevel === 'severe';
                const color = isSevere ? 'bg-red-50 border-red-400 text-red-900' : 'bg-orange-50 border-orange-400 text-orange-900';
                const icon = isSevere ? '🚨' : '⚠️';
                const tip = PRECAUTIONS[alert.diseaseCategory] || PRECAUTIONS['Other'];

                return (
                    <div key={alert.id} className={`flex items-start md:items-center justify-between p-4 rounded-xl border-2 shadow-sm ${color}`}>
                        <div className="flex gap-4 items-start md:items-center">
                            <span className="text-2xl mt-1 md:mt-0">{icon}</span>
                            <div className="flex flex-col">
                                <span className="font-black font-heading text-sm uppercase tracking-wider">
                                    {isSevere ? 'Severe Health Alert' : 'Health Advisory'} — {alert.diseaseCategory}
                                </span>
                                <span className="text-xs font-semibold mt-1 opacity-90 leading-snug">
                                    There is an active outbreak in your region. <strong>Precaution:</strong> {tip}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDismiss(alert.id)}
                            className="ml-4 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition hover:bg-black/10"
                        >
                            Dismiss
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default OutbreakBanner;
