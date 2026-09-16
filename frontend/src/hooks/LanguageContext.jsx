import React, { createContext, useContext, useState, useEffect } from 'react';
import useAuth from './useAuth';
import axios from 'axios';
import { getTranslatedText } from '../utils/translations';

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
        if (user && user.role === 'patient' && token) {
            axios.patch(`${import.meta.env.VITE_API_URL}/profile/patient/language`, { language: currentLang }, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(e => console.warn("Failed to sync language upward", e.message));
        }

    }, [currentLang, user, token]);

    /**
     * Translation helper function t(text)
     */
    const t = (text) => {
        return getTranslatedText(text, currentLang);
    };

    return (
        <LanguageContext.Provider value={{ currentLang, setCurrentLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
