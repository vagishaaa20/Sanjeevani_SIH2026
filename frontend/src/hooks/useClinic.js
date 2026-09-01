import { useState } from 'react';
import clinicService from '../services/clinicService';

export const useClinic = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getPendingClinics = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await clinicService.getPendingClinics();
            return data.clinics;
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to fetch pending clinics';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    const verifyClinic = async (id, status) => {
        setLoading(true);
        setError(null);
        try {
            const result = await clinicService.verifyClinic(id, status);
            return result;
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to verify clinic';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    const updateClinic = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const result = await clinicService.updateClinicProfile(data);
            return result;
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to update clinic profile';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        getPendingClinics,
        verifyClinic,
        updateClinic,
    };
};

export default useClinic;
