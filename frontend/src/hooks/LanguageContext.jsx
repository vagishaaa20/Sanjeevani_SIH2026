import React, { createContext, useContext, useState, useEffect } from 'react';
import useAuth from './useAuth';
import axios from 'axios';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const { user, token } = useAuth();
    // Default to 'en', but initialized via localStorage to prevent flash of English if previously selected
    const [currentLang, setCurrentLang] = useState(() => {
        return localStorage.getItem('sanjeevani_patient_lang') || 'en';
    });

    useEffect(() => {
        // Sync local storage on any change
        localStorage.setItem('sanjeevani_patient_lang', currentLang);

        // Optionally, if the user is authenticated as a patient, sync this up to their backend profile
        // so that if they log in elsewhere, their language carries over (assuming a backend patch route exists)
        if (user && user.role === 'patient' && token) {
            axios.patch(`${import.meta.env.VITE_API_URL}/profile/patient/language`, { language: currentLang }, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(e => console.warn("Failed to sync language upward", e.message));
        }

    }, [currentLang, user, token]);

    return (
        <LanguageContext.Provider value={{ currentLang, setCurrentLang }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
