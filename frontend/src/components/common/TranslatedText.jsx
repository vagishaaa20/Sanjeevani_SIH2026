import React from 'react';
import useTranslatedText from '../../hooks/useTranslatedText';

/**
 * A lightweight wrapper component to organically inject Bhashini translations 
 * inside deep React trees or map() loops where raw hooks can't be assigned statically.
 */
const TranslatedText = ({ text }) => {
    const translated = useTranslatedText(text);
    return <>{translated}</>;
};

export default TranslatedText;
