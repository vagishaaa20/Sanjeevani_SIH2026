const { generateText } = require('../utils/aiClient');

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
 * Extracts structured medication data from prescription text using AI.
 *
 * @param {string} prescriptionText
 * @returns {Promise<Array<{name: string, dosage: string, frequency: string}>>}
 */
async function extractMedications(prescriptionText) {
    if (!prescriptionText?.trim()) return [];

    try {
        const rawText = await generateText({
            prompt: EXTRACTION_PROMPT(prescriptionText),
            temperature: 0.1,
            maxTokens: 512,
            json: true,
        });

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
    } catch (err) {
        console.error('[extractMedications] Extraction error:', err.message);
        return [];
    }
}

module.exports = { extractMedications };
