import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext'; // We'll create this to track current global language

/**
 * Dynamically translates English UI text into the user's selected language using Bhashini via our backend router.
 * Fallbacks cleanly to the provided English text immediately on hydration or error.
 */
function useTranslatedText(defaultEnglishText) {
    const { currentLang } = useLanguage();
    const [translatedText, setTranslatedText] = useState(defaultEnglishText);

    useEffect(() => {
        if (!defaultEnglishText || currentLang === 'en' || !currentLang) {
            setTranslatedText(defaultEnglishText);
            return;
        }

        const cacheKey = `bhashini_${currentLang}_${defaultEnglishText}`;
        const locallyCached = localStorage.getItem(cacheKey);

        if (locallyCached) {
            setTranslatedText(locallyCached);
            return;
        }

        let isMounted = true;

        // Fetch securely from our custom translation backend
        const fetchTranslation = async () => {
            try {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/translate`, {
                    text: defaultEnglishText,
                    sourceLang: 'en',
                    targetLang: currentLang
                });

                if (response.data?.translatedText && isMounted) {
                    setTranslatedText(response.data.translatedText);
                    // Commit to localStorage to avoid ever translating this exact string for this exact language again on this machine
                    localStorage.setItem(cacheKey, response.data.translatedText);
                }
            } catch (err) {
                console.warn(`[useTranslation] Failed to translate: "${defaultEnglishText}" to ${currentLang}.`, err.message);
                if (isMounted) setTranslatedText(defaultEnglishText); // Fallback organically
            }
        };

        fetchTranslation();

        return () => { isMounted = false; };
    }, [defaultEnglishText, currentLang]);

    return translatedText;
}

export default useTranslatedText;
