import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage and verify profile
    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/profile/me');
            const data = response.data;
            setUser({
                ...data.user,
                profile: data.profile,
            });
            localStorage.setItem('user', JSON.stringify({ ...data.user, profile: data.profile }));
        } catch (error) {
            console.error('Failed to load profile:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (accessToken) {
            if (storedUser) {
                setUser(JSON.parse(storedUser));
                setLoading(false);
                // Silently sync with backend profile
                fetchCurrentUser();
            } else {
                fetchCurrentUser();
            }
        } else {
            setLoading(false);
        }

        const handleLogoutEvent = () => {
            setUser(null);
        };

        window.addEventListener('auth-logout', handleLogoutEvent);
        return () => window.removeEventListener('auth-logout', handleLogoutEvent);
    }, []);

    const login = async (credentials) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', credentials);
            const { user: userRecord, accessToken, refreshToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Now fetch full profile
            const profileResponse = await api.get('/profile/me');
            const completeUser = {
                ...profileResponse.data.user,
                profile: profileResponse.data.profile,
            };

            setUser(completeUser);
            localStorage.setItem('user', JSON.stringify(completeUser));
            return completeUser;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const registerPatient = async (data) => {
        // data: { phone, fullName, dateOfBirth, sex, preferredLanguage, region, abhaNumber }
        const response = await api.post('/auth/register/patient', data);
        return response.data; // Includes devOtp if in development
    };

    const sendPatientOtp = async (phone) => {
        const response = await api.post('/auth/otp/send', { phone });
        return response.data; // Includes userId and devOtp in development
    };

    const verifyPatientOtp = async (userId, otp) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/otp/verify', { userId, otp });
            const { user: userRecord, accessToken, refreshToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Fetch profile
            const profileResponse = await api.get('/profile/me');
            const completeUser = {
                ...profileResponse.data.user,
                profile: profileResponse.data.profile,
            };

            setUser(completeUser);
            localStorage.setItem('user', JSON.stringify(completeUser));
            return completeUser;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const registerDoctor = async (data) => {
        // data: { fullName, email, phone, password, city, medicalRegistrationCertificate, mbbsOrPrimaryQualification, ...otherFields }
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append(key, value);
            } else if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        const response = await api.post('/auth/register/doctor', formData);
        return response.data;
    };
    const registerClinic = async (data) => {
        // data: { clinicName, email, password, licenseNumber, city, address, latitude, longitude, departments }
        const response = await api.post('/auth/register/clinic', data);
        return response.data;
    };

    const updateProfile = async (role, data) => {
        // role: 'patient' | 'doctor' | 'clinic' | 'reviewer'
        const endpoint = `/profile/${role}`;
        const response = await api.patch(endpoint, data);

        // Refresh user profile
        await fetchCurrentUser();
        return response.data;
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (err) {
            console.warn('Backend logout failed/ignored:', err);
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                registerPatient,
                sendPatientOtp,
                verifyPatientOtp,
                registerDoctor,
                registerClinic,
                updateProfile,
                logout,
                refreshProfile: fetchCurrentUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
