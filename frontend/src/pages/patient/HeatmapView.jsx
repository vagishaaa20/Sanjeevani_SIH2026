import React, { useEffect, useState, useContext, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Flame,
    ShieldAlert,
    Activity,
    AlertTriangle,
    CheckCircle2,
    MapPin,
    Calendar,
    BarChart3,
    Filter,
    Layers,
    Info,
    RefreshCw
} from 'lucide-react';
import { outbreakService } from '../../services/outbreakService';
import { SocketContext } from '../../context/SocketContext';

// Safe India Map Center
const INDIA_CENTER = [22.9734, 78.6569];

// Disease categories
const DISEASE_CATEGORIES = [
    'All',
    'Fever/Infectious',
    'Respiratory',
    'Gastrointestinal',
    'Skin/Allergic',
    'Neurological',
    'Cardiovascular'
];

export const HeatmapView = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { socket } = useContext(SocketContext);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [trendLoading, setTrendLoading] = useState(false);

    useEffect(() => {
        loadAlerts();
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

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const res = await outbreakService.getActiveAlerts();
            setAlerts(res.alerts || []);
        } catch (err) {
            console.error('Failed to load active outbreak alerts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSocketUpdate = (payload) => {
        setAlerts((prev) => {
            const idx = prev.findIndex(
                (a) => a.geohash === payload.geohash && a.diseaseCategory === payload.diseaseCategory
            );
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = {
                    ...next[idx],
                    riskLevel: payload.riskLevel,
                    reportedCount: payload.reportedCount,
                    confirmedCount: payload.confirmedCount,
                };
                return next;
            } else {
                return [
                    {
                        id: payload.id,
                        geohash: payload.geohash,
                        diseaseCategory: payload.diseaseCategory,
                        riskLevel: payload.riskLevel,
                        reportedCount: payload.reportedCount,
                        confirmedCount: payload.confirmedCount,
                        centerLat: payload.lat,
                        centerLng: payload.lng,
                        isActive: true,
                    },
                    ...prev,
                ];
            }
        });
    };

    const handleSocketResolve = (payload) => {
        setAlerts((prev) => prev.filter((a) => a.id !== payload.id));
        if (selectedAlert?.id === payload.id) {
            setSelectedAlert(null);
        }
    };

    const handleSelectHotspot = async (alert) => {
        setSelectedAlert(alert);
        setTrendLoading(true);
        try {
            const res = await outbreakService.getDetails(alert.id);
            setTrendData(res.trend || []);
        } catch (err) {
            console.error(err);
            setTrendData([]);
        } finally {
            setTrendLoading(false);
        }
    };

    const filteredAlerts = alerts.filter((a) => {
        if (selectedCategory === 'All') return true;
        return a.diseaseCategory === selectedCategory;
    });

    const getRiskStyles = (riskLevel) => {
        switch (riskLevel) {
            case 'severe':
                return {
                    color: '#e11d48',
                    fillColor: '#f43f5e',
                    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
                    dotBg: 'bg-rose-500'
                };
            case 'moderate':
                return {
                    color: '#ea580c',
                    fillColor: '#f97316',
                    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                    dotBg: 'bg-amber-500'
                };
            default:
                return {
                    color: '#16a34a',
                    fillColor: '#22c55e',
                    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    dotBg: 'bg-emerald-500'
                };
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left relative max-w-7xl mx-auto pb-12 animate-fade-in-up">
            {/* Header */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68] shadow-xs shrink-0">
                        <Flame className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl md:text-3xl font-black text-[#1c1218] font-heading tracking-tight">
                                Epidemic Surveillance Heatmap (India)
                            </h1>
                            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                                Live Outbreak Feed
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-[#7d6974] mt-1">
                            Algorithmic geospatial disease tracking across verified district geohashes & clinical triage signals.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={loadAlerts}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-full bg-[#fdf5f7] border border-[#f5e4ec] text-xs font-bold text-[#2d2329] hover:bg-[#ffe6ee] hover:text-[#e13b68] transition shadow-xs cursor-pointer flex items-center gap-2"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Data</span>
                    </button>
                </div>
            </div>

            {/* Disease Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-black text-[#7d6974] uppercase tracking-wider flex items-center gap-1 shrink-0 pl-1">
                    <Filter className="w-3.5 h-3.5" />
                    Filter:
                </span>
                {DISEASE_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                            selectedCategory === cat
                                ? 'bg-[#e13b68] text-white border-[#e13b68] shadow-xs'
                                : 'bg-white text-[#4a3c45] border-[#f5e4ec] hover:border-[#f0d5df] hover:bg-[#fffafc]'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[620px]">
                {/* Map Area */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-[#f5e4ec] p-2 shadow-xs flex flex-col relative overflow-hidden h-[540px] lg:h-[640px]">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#7d6974] bg-[#fffafc]">
                            Loading India geospatial layer...
                        </div>
                    ) : (
                        <MapContainer
                            center={INDIA_CENTER}
                            zoom={5}
                            minZoom={4}
                            maxZoom={12}
                            scrollWheelZoom={true}
                            style={{ height: '100%', width: '100%', borderRadius: '1.25rem' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Geospatial Circle Markers for Outbreaks */}
                            {filteredAlerts.map((alert) => {
                                const lat = parseFloat(alert.centerLat);
                                const lng = parseFloat(alert.centerLng);
                                if (isNaN(lat) || isNaN(lng)) return null;

                                const style = getRiskStyles(alert.riskLevel);
                                const radius = alert.riskLevel === 'severe' ? 24 : alert.riskLevel === 'moderate' ? 18 : 12;

                                return (
                                    <CircleMarker
                                        key={alert.id}
                                        center={[lat, lng]}
                                        radius={radius}
                                        pathOptions={{
                                            color: style.color,
                                            fillColor: style.fillColor,
                                            fillOpacity: 0.45,
                                            weight: 2,
                                        }}
                                        eventHandlers={{
                                            click: () => handleSelectHotspot(alert),
                                        }}
                                    >
                                        <Popup>
                                            <div className="p-1 flex flex-col gap-1 text-left min-w-[160px]">
                                                <span className="font-black text-xs text-[#1c1218]">
                                                    {alert.diseaseCategory}
                                                </span>
                                                <span className="text-[11px] font-bold uppercase text-rose-600">
                                                    {alert.riskLevel} Risk
                                                </span>
                                                <div className="text-[11px] text-[#4a3c45]">
                                                    <p>Confirmed: {alert.confirmedCount || 0}</p>
                                                    <p>Reported: {alert.reportedCount || 0}</p>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            })}
                        </MapContainer>
                    )}

                    {/* Overlay Legend */}
                    <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md border border-[#f5e4ec] rounded-2xl p-3 shadow-md flex items-center gap-4 text-xs font-bold">
                        <div className="flex items-center gap-1.5 text-rose-700">
                            <span className="w-3 h-3 rounded-full bg-rose-500" />
                            <span>Severe</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-700">
                            <span className="w-3 h-3 rounded-full bg-amber-500" />
                            <span>Moderate</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span>Watch</span>
                        </div>
                    </div>
                </div>

                {/* Hotspot List & 7-Day Trend Panel */}
                <div className="bg-white rounded-3xl border border-[#f5e4ec] p-6 shadow-xs flex flex-col gap-5 h-[540px] lg:h-[640px] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#f5e4ec] pb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-[#e13b68]" />
                            <h3 className="font-black text-sm text-[#1c1218] font-heading">
                                Active Regional Hotspots
                            </h3>
                        </div>
                        <span className="text-xs font-bold text-[#7d6974]">
                            {filteredAlerts.length} Active
                        </span>
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                        {filteredAlerts.length === 0 && !loading && (
                            <div className="text-center py-12 flex flex-col items-center justify-center gap-2 text-[#7d6974]">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                <p className="text-xs font-bold">No active epidemic outbreaks detected</p>
                                <p className="text-[11px]">
                                    All monitored regions in India are currently within normal baseline limits.
                                </p>
                            </div>
                        )}

                        {filteredAlerts.map((a) => {
                            const isSelected = selectedAlert?.id === a.id;
                            const style = getRiskStyles(a.riskLevel);
                            return (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => handleSelectHotspot(a)}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                                        isSelected
                                            ? 'bg-[#fff0f4] border-[#f8c8d8] shadow-2xs'
                                            : 'bg-white border-[#f5e4ec] hover:border-[#f0d5df] hover:bg-[#fffafc]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-black text-xs sm:text-sm text-[#1c1218]">
                                            {a.diseaseCategory}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badgeBg}`}
                                        >
                                            {a.riskLevel}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#7d6974]">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-[#e13b68]" />
                                            <span>Geohash: {a.geohash}</span>
                                        </div>
                                        <span>
                                            {a.confirmedCount || 0} Confirmed • {a.reportedCount || 0} Reported
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* 7-Day Trend Section */}
                    {selectedAlert && (
                        <div className="border-t border-[#f5e4ec] pt-4 flex flex-col gap-3 shrink-0 bg-[#fffdfd] p-3 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <h4 className="font-black text-xs text-[#1c1218] flex items-center gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5 text-[#e13b68]" />
                                    <span>7-Day Trajectory: {selectedAlert.diseaseCategory}</span>
                                </h4>
                                <span className="text-[10px] font-bold text-[#7d6974]">{selectedAlert.geohash}</span>
                            </div>

                            {trendLoading ? (
                                <div className="h-24 flex items-center justify-center text-xs font-bold text-[#7d6974] animate-pulse">
                                    Loading trend data...
                                </div>
                            ) : trendData.length > 0 ? (
                                <div className="flex items-end gap-1.5 h-24 w-full pt-4">
                                    {trendData.map((d, i) => {
                                        const maxCase = Math.max(...trendData.map((td) => td.count), 1);
                                        const hPct = Math.max((d.count / maxCase) * 100, 10);
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 flex flex-col justify-end items-center group relative h-full"
                                            >
                                                <div
                                                    className="w-full bg-[#e13b68] hover:bg-[#c92a55] rounded-t-md transition-all cursor-pointer"
                                                    style={{ height: `${hPct}%` }}
                                                />
                                                <span className="text-[9px] mt-1 text-[#7d6974] font-bold">
                                                    {new Date(d.date).getDate()}
                                                </span>
                                                <div className="absolute -top-7 bg-[#1c1218] text-white text-[10px] px-2 py-0.5 rounded-lg hidden group-hover:block z-20 font-bold whitespace-nowrap shadow-md">
                                                    {d.count} cases
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[11px] text-[#7d6974] text-center py-4">
                                    No historical incident reports recorded in the last 7 days.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeatmapView;
