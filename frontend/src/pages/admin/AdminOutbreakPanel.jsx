import React, { useEffect, useState, useContext } from 'react';
import { outbreakService } from '../../services/outbreakService';
import { SocketContext } from '../../context/SocketContext';

const AdminOutbreakPanel = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useContext(SocketContext);

    useEffect(() => {
        fetchAlerts();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('outbreak:update', handleSocketUpdate);
        socket.on('outbreak:resolved', handleSocketResolve);
        return () => {
            socket.off('outbreak:update', handleSocketUpdate);
            socket.off('outbreak:resolved', handleSocketResolve);
        };
    }, [socket]);

    const fetchAlerts = async () => {
        try {
            const res = await outbreakService.getActiveAlerts();
            setAlerts(res.alerts);
        } catch (err) {
            console.error('Fetch alerts failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSocketUpdate = (payload) => {
        setAlerts(prev => {
            const exists = prev.find(a => a.id === payload.id);
            if (exists) {
                return prev.map(a => a.id === payload.id ? { ...a, riskLevel: payload.riskLevel, caseCount: payload.caseCount } : a);
            }
            return [{ ...payload, isActive: true }, ...prev];
        });
    };

    const handleSocketResolve = (payload) => {
        setAlerts(prev => prev.filter(a => a.id !== payload.id));
    };

    const handleResolve = async (id) => {
        if (!window.confirm("Are you sure you want to mark this outbreak as resolved?")) return;
        try {
            await outbreakService.resolveAlert(id);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            alert("Failed to resolve alert.");
        }
    };

    const handleBroadcast = async (id, category, count) => {
        if (!window.confirm(`Force WhatsApp broadcast to all patients in this region for ${category}?`)) return;
        try {
            await outbreakService.broadcastAdvisory(id);
            alert("Broadcast sent successfully!");
        } catch (err) {
            alert("Failed to send broadcast.");
        }
    };

    const sortedAlerts = [...alerts].sort((a, b) => {
        const order = { 'severe': 3, 'moderate': 2, 'watch': 1 };
        return (order[b.riskLevel] || 0) - (order[a.riskLevel] || 0);
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-ink-black font-heading">Epidemic Response</h1>
                    <p className="text-sm font-semibold text-ink-charcoal mt-1">Monitor and manage active disease outbreaks nationwide.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-ink-black p-6 shadow-sm overflow-x-auto text-left">
                {loading ? (
                    <div className="py-8 text-center font-bold text-ink-charcoal">Loading active alerts...</div>
                ) : sortedAlerts.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center gap-2">
                        <span className="text-4xl">🌟</span>
                        <span className="font-bold text-ink-charcoal">No active outbreaks detected.</span>
                    </div>
                ) : (
                    <table className="w-full text-sm font-semibold text-ink-charcoal">
                        <thead>
                            <tr className="border-b-2 border-ink-black/20 uppercase tracking-widest text-xs text-ink-muted">
                                <th className="pb-3 px-4">Risk Level</th>
                                <th className="pb-3 px-4">Disease Category</th>
                                <th className="pb-3 px-4">Cases (72h)</th>
                                <th className="pb-3 px-4">Region (Geohash)</th>
                                <th className="pb-3 px-4">Detected</th>
                                <th className="pb-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAlerts.map(alert => {
                                const level = alert.riskLevel;
                                const isSevere = level === 'severe';
                                const badgeColor = isSevere ? 'bg-red-500' : level === 'moderate' ? 'bg-orange-500' : 'bg-lime-500';

                                return (
                                    <tr key={alert.id} className="border-b border-ink-black/5 hover:bg-ink-black/5 transition">
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-1 rounded text-white text-[10px] uppercase font-bold tracking-wider ${badgeColor}`}>
                                                {level}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 font-black">{alert.diseaseCategory}</td>
                                        <td className="py-4 px-4">{alert.caseCount || alert.case_count}</td>
                                        <td className="py-4 px-4"><code className="bg-ink-black/10 px-1 py-0.5 rounded">{alert.geohash}</code></td>
                                        <td className="py-4 px-4">{new Date(alert.createdAt || alert.created_at).toLocaleDateString()}</td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleBroadcast(alert.id, alert.diseaseCategory, alert.caseCount)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
                                                >
                                                    📢 Broadcast
                                                </button>
                                                <button
                                                    onClick={() => handleResolve(alert.id)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                                                >
                                                    ✓ Resolve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminOutbreakPanel;
