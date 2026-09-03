import { useCallback, useEffect, useState } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import medicineService from '../../services/medicineService';

const getStatusMeta = (status) => {
    switch (status) {
        case 'AVAILABLE':
            return { label: 'Available', colorClass: 'border-emerald-300 bg-emerald-50 text-emerald-700' };
        case 'LOW_STOCK':
            return { label: 'Low stock', colorClass: 'border-amber-300 bg-amber-50 text-amber-700' };
        case 'UNAVAILABLE':
            return { label: 'Unavailable', colorClass: 'border-zinc-300 bg-zinc-100 text-zinc-700' };
        case 'OUT_OF_STOCK':
        default:
            return { label: 'Out of stock', colorClass: 'border-red-300 bg-red-50 text-red-700' };
    }
};

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

    const headline = results.length > 0 ? `Nearby availability for “${query.trim()}”` : 'Nearby availability';

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 shadow-sm">
                <h2 className="text-3xl font-black text-ink-black">Find Medicine</h2>
                <p className="text-sm font-semibold text-ink-charcoal mt-1">Search for medicines and compare clinics nearby</p>
            </div>

            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-stretch">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search medicine name..."
                        className="flex-1 border-2 border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:border-cerulean"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-3 rounded-xl border-2 border-ink-black bg-ink-black text-white font-bold text-sm hover:bg-white hover:text-ink-black transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {geoLoading && <p className="text-sm text-ink-charcoal">Getting your location…</p>}
            {permissionDenied && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-700 font-semibold">
                    Location access denied. Showing available clinics without distance sorting.
                </div>
            )}
            {error && <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm">{error}</div>}

            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-5">
                <h3 className="text-lg font-black text-ink-black">{headline}</h3>

                {loading ? (
                    <div className="text-sm text-ink-charcoal">Checking nearby clinics…</div>
                ) : results.length === 0 ? (
                    <div className="text-sm text-ink-charcoal">
                        No matching medicine was found in nearby verified clinics.
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {results.map((entry) => {
                            const statusMeta = getStatusMeta(entry.status);
                            return (
                                <div key={`${entry.medicineId}-${entry.clinic.clinicId}`} className="border-2 border-ink-black rounded-2xl p-4 bg-cream-surface">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div>
                                            <h4 className="text-lg font-black text-ink-black">{entry.medicineName}</h4>
                                            {entry.genericName && <p className="text-xs text-ink-muted mt-0.5">{entry.genericName}</p>}
                                        </div>
                                        <span className={`inline-flex border px-2.5 py-1 rounded-full text-xs font-bold ${statusMeta.colorClass}`}>
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-bold text-ink-black">{entry.clinic.clinicName}</p>
                                                <p className="text-xs text-ink-muted">{entry.clinic.city || 'Local clinic'}</p>
                                            </div>
                                            <div className="text-right">
                                                {entry.clinic.distanceKm !== null ? (
                                                    <p className="text-sm font-bold text-cerulean-dark">{entry.clinic.distanceKm} km</p>
                                                ) : (
                                                    <p className="text-xs text-ink-muted">Distance unavailable</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-sm font-semibold text-ink-charcoal">{statusMeta.label}</div>
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
