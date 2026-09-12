import React, { useCallback, useEffect, useState } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import medicineService from '../../services/medicineService';
import {
    Pill,
    Search,
    Building2,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Clock,
    Sparkles,
    Loader2,
    Phone,
    ArrowRight
} from 'lucide-react';
import Badge from '../../components/common/Badge';

const getStatusMeta = (status) => {
    switch (status) {
        case 'AVAILABLE':
            return { label: 'In Stock', variant: 'mint', dot: true };
        case 'LOW_STOCK':
            return { label: 'Low Stock', variant: 'peach', dot: true };
        case 'UNAVAILABLE':
            return { label: 'Unavailable', variant: 'muted', dot: false };
        case 'OUT_OF_STOCK':
        default:
            return { label: 'Out of Stock', variant: 'pink', dot: false };
    }
};

const POPULAR_MEDICINES = [
    'Paracetamol',
    'Amoxicillin',
    'Azithromycin',
    'Cetirizine',
    'Metformin',
    'ORS Sachet',
    'Pantoprazole',
    'Insulin',
];

const DEFAULT_QUERY = 'Paracetamol';

const MedicineAvailability = () => {
    const { coords, permissionDenied, loading: geoLoading } = useGeolocation();
    const [query, setQuery] = useState(DEFAULT_QUERY);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchResults = useCallback(async (searchTerm) => {
        const trimmed = searchTerm.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await medicineService.searchMedicines({
                query: trimmed,
                lat: coords?.lat,
                lng: coords?.lng,
            });
            setResults(response.results || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not fetch medicine availability');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [coords]);

    useEffect(() => {
        const loadResults = async () => {
            await fetchResults(DEFAULT_QUERY);
        };
        loadResults();
    }, [coords, fetchResults]);

    const handleSubmit = (event) => {
        event.preventDefault();
        fetchResults(query);
    };

    const handleSelectTag = (medName) => {
        setQuery(medName);
        fetchResults(medName);
    };

    const headline = results.length > 0 ? `Verified Nearby Stock for “${query.trim()}”` : 'Nearby Stock Availability';

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up pb-12">
            {/* Header Title */}
            <div
                className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            Pharmacy &amp; Clinic Stock
                        </span>
                        <Badge variant="mint" dot>
                            Live Inventory Sync
                        </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        Find Medicine Availability
                    </h1>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Search essential medicines, check live inventory at nearby registered clinics, and compare distances.
                    </p>
                </div>

                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--notif-unread-border)' }}
                >
                    <Pill className="w-6 h-6" />
                </div>
            </div>

            {/* Search Card */}
            <div
                className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-4"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type medicine name or generic salt (e.g. Paracetamol, Amoxicillin)..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 transition"
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-7 py-3 rounded-full font-bold text-xs md:text-sm transition shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 text-white"
                        style={{ background: 'var(--accent)' }}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>{loading ? 'Searching…' : 'Find Medicine'}</span>
                    </button>
                </form>

                {/* Popular Quick Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                        Popular:
                    </span>
                    {POPULAR_MEDICINES.map((med) => (
                        <button
                            key={med}
                            type="button"
                            onClick={() => handleSelectTag(med)}
                            className="px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer"
                            style={
                                query.toLowerCase() === med.toLowerCase()
                                    ? { background: 'var(--accent)', color: '#fff' }
                                    : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                            }
                        >
                            {med}
                        </button>
                    ))}
                </div>
            </div>

            {/* Geolocation Notice */}
            {geoLoading && (
                <div className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--accent)' }} />
                    <span>Detecting your location for accurate proximity calculation…</span>
                </div>
            )}
            {permissionDenied && (
                <div
                    className="p-4 rounded-2xl text-xs font-semibold flex items-center gap-2"
                    style={{ background: 'var(--pastel-peach-bg)', border: '1px solid var(--pastel-peach-text)', color: 'var(--pastel-peach-text)' }}
                >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Location access is disabled. Clinics are displayed without distance sorting.</span>
                </div>
            )}
            {error && (
                <div
                    className="p-4 rounded-2xl text-xs font-bold flex items-center gap-2"
                    style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Results Grid */}
            <div
                className="rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-xs"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-black font-heading" style={{ color: 'var(--text-primary)' }}>{headline}</h3>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Verified stock counts reported directly from partner health clinics.
                            </p>
                        </div>
                    </div>
                    {results.length > 0 && (
                        <span
                            className="text-xs font-bold px-3 py-1 rounded-full"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            {results.length} Center{results.length > 1 ? 's' : ''} Found
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
                        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Checking pharmacy inventory at nearby clinics…</span>
                    </div>
                ) : results.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <div
                            className="w-14 h-14 rounded-3xl flex items-center justify-center"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                            <Pill className="w-7 h-7" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No matching medicine stock found</h4>
                            <p className="text-xs font-medium mt-0.5 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                                Try searching by the generic salt name (e.g., “Paracetamol” instead of brand name) or check alternative medicines.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((entry, idx) => {
                            const statusMeta = getStatusMeta(entry.status);
                            return (
                                <div
                                    key={`${entry.medicineId || idx}-${entry.clinic?.clinicId || idx}`}
                                    className="rounded-3xl p-5 transition flex flex-col justify-between gap-4 shadow-2xs hover:shadow-xs group"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="text-base font-black leading-snug" style={{ color: 'var(--text-primary)' }}>
                                                    {entry.medicineName}
                                                </h4>
                                                {entry.genericName && (
                                                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                                        Salt: {entry.genericName}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={statusMeta.variant} dot={statusMeta.dot}>
                                                {statusMeta.label}
                                            </Badge>
                                        </div>

                                        <div
                                            className="p-3 rounded-2xl flex flex-col gap-1.5"
                                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2">
                                                    <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                                                    <div>
                                                        <p className="font-bold text-xs md:text-sm" style={{ color: 'var(--text-primary)' }}>
                                                            {entry.clinic?.clinicName || 'Registered Health Center'}
                                                        </p>
                                                        <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                                            <MapPin className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                                                            <span>{entry.clinic?.city || entry.clinic?.address || 'Local Clinic'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {entry.clinic?.distanceKm !== null && entry.clinic?.distanceKm !== undefined ? (
                                                    <span
                                                        className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                                                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                                    >
                                                        {Number(entry.clinic.distanceKm).toFixed(1)} km away
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                            {entry.availableQuantity ? `Quantity: ${entry.availableQuantity} units` : 'Available for pickup'}
                                        </span>
                                        <button
                                            type="button"
                                            className="text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                                            style={{ color: 'var(--accent)' }}
                                        >
                                            <span>Clinic Details</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicineAvailability;
