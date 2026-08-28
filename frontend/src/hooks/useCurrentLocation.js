import { useState, useCallback } from 'react';

/**
 * Geolocation hook with manual trigger support.
 * Does NOT auto-fire on mount — user must call `getLocation()` explicitly.
 * This avoids the silent-failure problem with cached browser permission states.
 */
export function useCurrentLocation() {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported by your browser.');
            return;
        }
        setLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    return { location, error, loading, getLocation };
}
