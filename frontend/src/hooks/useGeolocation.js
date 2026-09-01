import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

/**
 * Captures the browser's GPS location and automatically saves it to the
 * user's backend profile via PATCH /api/profile/location.
 *
 * Returns:
 *   coords          - { lat, lng } | null
 *   permissionDenied - true if user denied location access
 *   loading         - true while the initial position is being fetched
 *   synced          - true once coordinates have been saved to DB successfully
 */
export default function useGeolocation() {
    const [coords, setCoords] = useState(null);
    const [error, setError] = useState(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [synced, setSynced] = useState(false);

    // Prevent double-saving if the hook re-renders
    const hasSynced = useRef(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                setCoords({ lat, lng });
                setLoading(false);

                // Auto-save to DB once per session
                if (!hasSynced.current) {
                    hasSynced.current = true;
                    try {
                        await api.patch('/profile/location', { lat, lng });
                        setSynced(true);
                        console.log('[useGeolocation] Location saved to profile:', lat, lng);
                    } catch (saveErr) {
                        // Non-blocking — location still works for nearby search even if DB save fails
                        console.warn('[useGeolocation] Failed to save location to profile:', saveErr?.response?.data?.error || saveErr.message);
                    }
                }
            },
            (err) => {
                setError(err.message);
                if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    return { coords, error, permissionDenied, loading, synced };
}