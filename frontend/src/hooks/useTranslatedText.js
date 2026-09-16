import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import { getTranslatedText } from '../utils/translations';

/**
 * Dynamically translates English UI text into the user's selected language using 
 * local dictionary first, and Bhashini via backend router as fallback for dynamic content.
 */
function useTranslatedText(defaultEnglishText) {
    const { currentLang } = useLanguage();
    const [translatedText, setTranslatedText] = useState(() => getTranslatedText(defaultEnglishText, currentLang));

    useEffect(() => {
        if (!defaultEnglishText || currentLang === 'en' || !currentLang) {
            setTranslatedText(defaultEnglishText);
            return;
        }

        // Check local translation dictionary first
        const localTrans = getTranslatedText(defaultEnglishText, currentLang);
        if (localTrans !== defaultEnglishText) {
            setTranslatedText(localTrans);
            return;
        }

        const cacheKey = `bhashini_v2_${currentLang}_${defaultEnglishText}`;
        const locallyCached = localStorage.getItem(cacheKey);

        if (locallyCached) {
            setTranslatedText(locallyCached);
            return;
        }

        let isMounted = true;

        // Fetch from custom translation backend for unmapped dynamic strings
        const fetchTranslation = async () => {
            try {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/translate`, {
                    text: defaultEnglishText,
                    sourceLang: 'en',
                    targetLang: currentLang
                });

                if (response.data?.translatedText && isMounted) {
                    setTranslatedText(response.data.translatedText);
                    localStorage.setItem(cacheKey, response.data.translatedText);
                }
            } catch (err) {
                if (isMounted) setTranslatedText(localTrans); // Fallback to local string
            }
        };

        fetchTranslation();

        return () => { isMounted = false; };
    }, [defaultEnglishText, currentLang]);

    return translatedText;
}

export default useTranslatedText;
