const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const EXTRACTION_PROMPT = (prescriptionText) =>
    `Extract all medications from the following prescription text.
Return ONLY a valid JSON array in this exact format (no markdown, no extra text):
[{"name": "<medicine name>", "dosage": "<dosage>", "frequency": "<one of: once_daily|twice_daily|three_times_daily|four_times_daily|as_needed>"}]

If no medications are found, return an empty array: []

Prescription:
"""
${prescriptionText}
"""`;

/**
 * Extracts structured medication data from prescription text using Gemini.
 *
 * @param {string} prescriptionText
 * @returns {Promise<Array<{name: string, dosage: string, frequency: string}>>}
 */
async function extractMedications(prescriptionText) {
    if (!prescriptionText?.trim()) return [];

    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment');
    }

    const response = await axios.post(
        GEMINI_URL,
        {
            contents: [{ parts: [{ text: EXTRACTION_PROMPT(prescriptionText) }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        },
        { timeout: 15000 }
    );

    const rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!rawText) return [];

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    const VALID_FREQUENCIES = ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed'];

    return parsed
        .filter((m) => m?.name)
        .map((m) => ({
            name: String(m.name).trim(),
            dosage: m.dosage ? String(m.dosage).trim() : null,
            frequency: VALID_FREQUENCIES.includes(m.frequency) ? m.frequency : 'once_daily',
        }));
}

module.exports = { extractMedications };
