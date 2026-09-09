const bhashiniService = require('../services/bhashiniService');
const crypto = require('crypto');

// LRU mapping via standard Map (will flush explicitly if it exceeds generic size bounds)
const MEMORY_CACHE = new Map();
const MAX_CACHE_KEYS = 5000;

async function postTranslate(req, res) {
    try {
        const { text, sourceLang = 'en', targetLang } = req.body;

        if (!text || !targetLang) {
            return res.status(400).json({ error: 'parameters "text" and "targetLang" are required.' });
        }

        if (sourceLang === targetLang) {
            return res.json({ translatedText: text });
        }

        // Cache Key formatting: textHash|source|target
        const textHash = crypto.createHash('md5').update(text).digest('hex');
        const cacheKey = `${textHash}_${sourceLang}_${targetLang}`;

        if (MEMORY_CACHE.has(cacheKey)) {
            return res.json({ translatedText: MEMORY_CACHE.get(cacheKey) });
        }

        const translatedText = await bhashiniService.translateText(text, sourceLang, targetLang);

        if (translatedText) {
            // Primitive LRU boundary cap
            if (MEMORY_CACHE.size >= MAX_CACHE_KEYS) {
                const firstKey = MEMORY_CACHE.keys().next().value;
                if (firstKey) MEMORY_CACHE.delete(firstKey);
            }
            MEMORY_CACHE.set(cacheKey, translatedText);
        }

        return res.json({ translatedText });
    } catch (err) {
        console.error('[translateController] POST /translate Error:', err);
        return res.status(500).json({ error: 'Translation pipeline failed.' });
    }
}

module.exports = { postTranslate };
