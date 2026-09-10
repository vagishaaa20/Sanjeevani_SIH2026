import React, { useEffect, useState, useContext } from 'react';
import { outbreakService } from '../../services/outbreakService';
import { SocketContext } from '../../context/SocketContext';
import { StatCard } from '../../components/common/StatCard';
import { EmergencyAlertBanner } from '../../components/common/EmergencyAlertBanner';
import { Badge } from '../../components/common/Badge';
import { StatusIndicator } from '../../components/common/StatusIndicator';
import { ShieldAlert, Activity, CheckCircle, Radio, Send } from 'lucide-react';

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
                return prev.map(a => a.id === payload.id ? { ...a, riskLevel: payload.riskLevel, reportedCount: payload.reportedCount, confirmedCount: payload.confirmedCount } : a);
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

    const severeCount = sortedAlerts.filter(a => a.riskLevel === 'severe').length;
    const totalCases = sortedAlerts.reduce((sum, a) => sum + (a.reportedCount || a.reported_count || 0), 0);

    return (
        <div className="flex flex-col gap-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <StatusIndicator status="active" label="Live Sentinel System" />
                    </div>
                    <h1 className="text-3xl font-black text-ink-black font-heading">Epidemic Response Desk</h1>
                    <p className="text-xs md:text-sm font-semibold text-ink-charcoal mt-0.5">
                        Real-time AI epidemic surveillance and emergency outbreak dispatch.
                    </p>
                </div>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Active Alerts"
                    value={sortedAlerts.length}
                    icon={Activity}
                    variant={sortedAlerts.length > 0 ? 'warning' : 'sky'}
                    description="Monitoring nationwide"
                />
                <StatCard
                    title="Critical Outbreaks"
                    value={severeCount}
                    icon={ShieldAlert}
                    variant={severeCount > 0 ? 'danger' : 'default'}
                    description="Requires immediate action"
                />
                <StatCard
                    title="Total Tracked Cases"
                    value={totalCases}
                    icon={Radio}
                    variant="pink"
                    description="Aggregated from reports"
                />
            </div>

            {severeCount > 0 && (
                <EmergencyAlertBanner
                    severity="danger"
                    title="High-Risk Epidemic Alert"
                    message={`${severeCount} severe outbreak cluster(s) require urgent health worker dispatch and WhatsApp advisory broadcasts.`}
                />
            )}

            <div className="bg-white rounded-2xl border-2 border-ink-black p-6 shadow-sm overflow-x-auto">
                {loading ? (
                    <div className="py-8 text-center font-bold text-ink-charcoal">Loading active alerts...</div>
                ) : sortedAlerts.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-ink-black">No Active Outbreaks</h4>
                        <p className="text-xs font-semibold text-ink-muted max-w-sm">
                            Epidemic surveillance monitors geohash regions continuously. All regions currently report normal health metrics.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm font-semibold text-ink-charcoal border-collapse">
                        <thead>
                            <tr className="border-b-2 border-ink-black bg-cream-surface text-left text-xs uppercase tracking-widest text-ink-charcoal font-black">
                                <th className="py-3.5 px-4">Risk Level</th>
                                <th className="py-3.5 px-4">Disease Category</th>
                                <th className="py-3.5 px-4">Cases (Rep / Conf)</th>
                                <th className="py-3.5 px-4">Region (Geohash)</th>
                                <th className="py-3.5 px-4">Detected</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-black/10">
                            {sortedAlerts.map(alert => {
                                const level = alert.riskLevel;
                                const isSevere = level === 'severe';
                                const variant = isSevere ? 'danger' : level === 'moderate' ? 'warning' : 'info';

                                return (
                                    <tr key={alert.id} className="hover:bg-cream-surface/50 transition duration-150">
                                        <td className="py-4 px-4">
                                            <Badge variant={variant} dot pulse={isSevere}>
                                                {level}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4 font-black text-ink-black">{alert.diseaseCategory}</td>
                                        <td className="py-4 px-4 text-xs font-bold">
                                            {alert.reportedCount || alert.reported_count || 0} / {alert.confirmedCount || alert.confirmed_count || 0}
                                        </td>
                                        <td className="py-4 px-4">
                                            <code className="bg-cream-surface border border-ink-black/20 px-2 py-1 rounded-md text-xs font-mono font-bold">
                                                {alert.geohash}
                                            </code>
                                        </td>
                                        <td className="py-4 px-4 text-xs font-medium">
                                            {new Date(alert.createdAt || alert.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleBroadcast(alert.id, alert.diseaseCategory, alert.confirmedCount)}
                                                    className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-cerulean hover:bg-cerulean-dark border border-ink-black transition flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    <span>Broadcast</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleResolve(alert.id)}
                                                    className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-ink-black transition flex items-center gap-1 cursor-pointer"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>Resolve</span>
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
