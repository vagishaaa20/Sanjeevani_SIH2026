import React, { useEffect, useState, useContext, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { outbreakService } from '../../services/outbreakService';
import { SocketContext } from '../../context/SocketContext';

// Helper component to add heat layer within MapContainer
const HeatmapLayer = ({ data }) => {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // Transform OutbreakAlert data into heat points: [lat, lng, intensity]
        const points = data.map(alert => {
            const intensity = alert.riskLevel === 'severe' ? 1.0 : alert.riskLevel === 'moderate' ? 0.6 : 0.3;
            // leaflet.heat expects [lat, lng, intensity]
            return [parseFloat(alert.centerLat), parseFloat(alert.centerLng), intensity];
        });

        if (layerRef.current) {
            map.removeLayer(layerRef.current);
        }

        layerRef.current = L.heatLayer(points, {
            radius: 40,
            blur: 25,
            maxZoom: 10,
            gradient: {
                0.2: 'blue',
                0.4: 'lime',
                0.6: 'orange',
                0.8: 'red'
            }
        }).addTo(map);

        return () => {
            if (layerRef.current && map) {
                map.removeLayer(layerRef.current);
            }
        };
    }, [map, data]);

    return null;
};

const HeatmapView = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useContext(SocketContext);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        loadAlerts();
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Listen for real-time updates
        socket.on('outbreak:update', handleSocketUpdate);
        socket.on('outbreak:resolved', handleSocketResolve);

        return () => {
            socket.off('outbreak:update', handleSocketUpdate);
            socket.off('outbreak:resolved', handleSocketResolve);
        };
    }, [socket, alerts]);

    const loadAlerts = async () => {
        try {
            const res = await outbreakService.getActiveAlerts();
            setAlerts(res.alerts);
        } catch (err) {
            console.error('Failed to load alerts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSocketUpdate = (payload) => {
        // Upsert alert in state
        setAlerts(prev => {
            const idx = prev.findIndex(a => a.geohash === payload.geohash && a.diseaseCategory === payload.diseaseCategory);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], riskLevel: payload.riskLevel, caseCount: payload.caseCount };
                return next;
            } else {
                return [{
                    id: payload.id,
                    geohash: payload.geohash,
                    diseaseCategory: payload.diseaseCategory,
                    riskLevel: payload.riskLevel,
                    caseCount: payload.caseCount,
                    centerLat: payload.lat,
                    centerLng: payload.lng,
                    isActive: true,
                }, ...prev];
            }
        });
    };

    const handleSocketResolve = (payload) => {
        setAlerts(prev => prev.filter(a => a.id !== payload.id));
        if (selectedAlert?.id === payload.id) {
            setSelectedAlert(null);
        }
    };

    const handleSelectHotspot = async (alert) => {
        setSelectedAlert(alert);
        try {
            const res = await outbreakService.getDetails(alert.id);
            setTrendData(res.trend);
        } catch (err) {
            console.error(err);
        }
    };

    const center = [22.8046, 86.2029]; // Default roughly around Jamshedpur area for demo

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-ink-black font-heading">Epidemic Heatmap</h1>
                    <p className="text-sm font-semibold text-ink-charcoal mt-1">Real-time disease surveillance based on AI triage data.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold"><span className="w-3 h-3 rounded-full bg-red-500"></span> Severe</div>
                    <div className="flex items-center gap-2 text-xs font-bold"><span className="w-3 h-3 rounded-full bg-orange-400"></span> Moderate</div>
                    <div className="flex items-center gap-2 text-xs font-bold"><span className="w-3 h-3 rounded-full bg-lime-400"></span> Watch</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
                {/* Map Area */}
                <div className="lg:col-span-3 rounded-2xl overflow-hidden border-2 border-ink-black shadow-sm relative z-0">
                    {loading ? (
                        <div className="w-full h-full bg-ink-black/5 flex items-center items-center justify-center font-bold text-ink-charcoal">
                            Loading Map...
                        </div>
                    ) : (
                        <MapContainer center={center} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <HeatmapLayer data={alerts} />

                            {/* Invisible click targets to select hotspots... simplified for demo using a list below instead of markers. */}
                        </MapContainer>
                    )}
                </div>

                {/* Sidebar */}
                <div className="bg-white rounded-2xl border-2 border-ink-black p-4 flex flex-col gap-4 overflow-y-auto">
                    <h3 className="font-black text-lg text-ink-black border-b-2 border-ink-black/10 pb-2">Active Hotspots</h3>

                    {alerts.length === 0 && !loading && (
                        <div className="text-sm font-semibold text-ink-muted text-center py-8">
                            No active outbreaks.
                        </div>
                    )}

                    {alerts.map(a => (
                        <div
                            key={a.id}
                            onClick={() => handleSelectHotspot(a)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1
                            ${selectedAlert?.id === a.id ? 'border-primary-600 bg-primary-50' : 'border-ink-black/10 hover:border-ink-black/30 bg-white'}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-black text-sm">{a.diseaseCategory}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase
                                    ${a.riskLevel === 'severe' ? 'bg-red-500' : a.riskLevel === 'moderate' ? 'bg-orange-500' : 'bg-lime-500'}
                                `}>
                                    {a.riskLevel}
                                </span>
                            </div>
                            <span className="text-xs font-semibold text-ink-charcoal">{a.caseCount} recent cases</span>
                        </div>
                    ))}

                    {/* Trend Sparkline Area */}
                    {selectedAlert && (
                        <div className="mt-auto border-t-2 border-ink-black/10 pt-4 flex flex-col gap-3">
                            <h4 className="font-black text-sm text-ink-black">7-Day Trend: {selectedAlert.diseaseCategory}</h4>
                            <div className="flex items-end gap-1 h-32 w-full pt-4">
                                {trendData.length > 0 ? trendData.map((d, i) => {
                                    const maxCase = Math.max(...trendData.map(td => td.count), 1);
                                    const hPct = (d.count / maxCase) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                                            <div className="w-full bg-primary-500 rounded-t-sm transition-all" style={{ height: `${hPct}%` }}></div>
                                            <span className="text-[9px] mt-1 text-ink-muted font-bold block">{new Date(d.date).getDate()}</span>
                                            <div className="absolute -top-6 bg-ink-black text-white text-[10px] px-2 py-1 rounded hidden group-hover:block z-10 font-bold whitespace-nowrap">
                                                {d.count} cases
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-ink-muted">Loading data...</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeatmapView;
