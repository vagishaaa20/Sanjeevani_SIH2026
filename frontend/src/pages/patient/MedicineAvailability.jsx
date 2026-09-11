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
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#e13b68] bg-[#ffe6ee] px-2.5 py-0.5 rounded-full">
                            Pharmacy & Clinic Stock
                        </span>
                        <Badge variant="mint" dot>
                            Live Inventory Sync
                        </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        Find Medicine Availability
                    </h1>
                    <p className="text-xs font-semibold text-[#7d6974] mt-1">
                        Search essential medicines, check live inventory at nearby registered clinics, and compare distances.
                    </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center font-bold flex-shrink-0">
                    <Pill className="w-6 h-6" />
                </div>
            </div>

            {/* Search Card */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-4">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-[#7d6974] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type medicine name or generic salt (e.g. Paracetamol, Amoxicillin)..."
                            className="w-full pl-11 pr-4 py-3 border border-[#f5e4ec] bg-[#fffcfd] rounded-2xl text-xs md:text-sm font-medium text-[#2d2329] focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68]"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-7 py-3 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white font-bold text-xs md:text-sm transition shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>{loading ? 'Searching…' : 'Find Medicine'}</span>
                    </button>
                </form>

                {/* Popular Quick Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f5e4ec]/60">
                    <span className="text-xs font-bold text-[#7d6974] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#e13b68]" />
                        Popular:
                    </span>
                    {POPULAR_MEDICINES.map((med) => (
                        <button
                            key={med}
                            type="button"
                            onClick={() => handleSelectTag(med)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                                query.toLowerCase() === med.toLowerCase()
                                    ? 'bg-[#e13b68] text-white shadow-2xs'
                                    : 'bg-[#fffcfd] border border-[#f5e4ec] text-[#7d6974] hover:bg-[#ffe6ee] hover:text-[#e13b68]'
                            }`}
                        >
                            {med}
                        </button>
                    ))}
                </div>
            </div>

            {/* Geolocation Notice */}
            {geoLoading && (
                <div className="text-xs text-[#7d6974] font-semibold flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e13b68]" />
                    <span>Detecting your location for accurate proximity calculation…</span>
                </div>
            )}
            {permissionDenied && (
                <div className="p-4 bg-[#fff0e6] border border-[#ffd5bf] rounded-2xl text-xs text-[#e07a38] font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Location access is disabled. Clinics are displayed without distance sorting.</span>
                </div>
            )}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* Results Grid */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#fdf0f4] pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center font-bold">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-black text-[#2d2329] font-heading">{headline}</h3>
                            <p className="text-xs text-[#7d6974] font-medium">
                                Verified stock counts reported directly from partner health clinics.
                            </p>
                        </div>
                    </div>
                    {results.length > 0 && (
                        <span className="bg-[#ffe6ee] text-[#8e1d41] text-xs font-bold px-3 py-1 rounded-full">
                            {results.length} Center{results.length > 1 ? 's' : ''} Found
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 text-[#e13b68] animate-spin" />
                        <span className="text-xs font-bold text-[#7d6974]">Checking pharmacy inventory at nearby clinics…</span>
                    </div>
                ) : results.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 rounded-3xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                            <Pill className="w-7 h-7" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-[#2d2329]">No matching medicine stock found</h4>
                            <p className="text-xs text-[#7d6974] font-medium mt-0.5 max-w-sm">
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
                                    className="border border-[#f5e4ec] hover:border-[#f5c6d6] rounded-3xl p-5 bg-[#fffcfd] hover:bg-white transition flex flex-col justify-between gap-4 shadow-2xs hover:shadow-xs"
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="text-base font-black text-[#2d2329] leading-snug">
                                                    {entry.medicineName}
                                                </h4>
                                                {entry.genericName && (
                                                    <p className="text-xs text-[#7d6974] font-medium mt-0.5">
                                                        Salt: {entry.genericName}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={statusMeta.variant} dot={statusMeta.dot}>
                                                {statusMeta.label}
                                            </Badge>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-white border border-[#f5e4ec] flex flex-col gap-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2">
                                                    <Building2 className="w-4 h-4 text-[#e13b68] flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-bold text-xs md:text-sm text-[#2d2329]">
                                                            {entry.clinic?.clinicName || 'Registered Health Center'}
                                                        </p>
                                                        <p className="text-[11px] text-[#7d6974] flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3 text-[#e13b68]" />
                                                            <span>{entry.clinic?.city || entry.clinic?.address || 'Local Clinic'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {entry.clinic?.distanceKm !== null && entry.clinic?.distanceKm !== undefined ? (
                                                    <span className="text-xs font-bold text-[#e13b68] bg-[#ffe6ee] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                                                        {Number(entry.clinic.distanceKm).toFixed(1)} km away
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#f5e4ec]">
                                        <span className="font-semibold text-[#7d6974]">
                                            {entry.availableQuantity ? `Quantity: ${entry.availableQuantity} units` : 'Available for pickup'}
                                        </span>
                                        <button
                                            type="button"
                                            className="text-xs font-bold text-[#e13b68] hover:text-[#c92a55] flex items-center gap-1"
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
