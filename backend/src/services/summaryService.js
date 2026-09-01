const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SUMMARY_PROMPT = (notes) =>
    `You are a medical communication assistant for Sanjeevani, a rural India health platform.
Summarize the following doctor's consultation notes in plain, simple language for a patient.
Include: diagnosis/finding, key advice, and follow-up timeline if mentioned.
Keep it under 4 sentences. Write in first person ("Dr. says...").

Doctor's notes:
"""
${notes}
"""

Respond with ONLY the summary text — no markdown, no quotes, no preamble.`;

/**
 * Generates a plain-language AI summary of doctor consultation notes.
 * Returns null if notes are empty/whitespace.
 *
 * @param {string} notesText — raw doctor notes or prescription text
 * @returns {Promise<string|null>}
 */
async function generateSummary(notesText) {
    if (!notesText?.trim()) return null;

    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment');
    }

    const response = await axios.post(
        GEMINI_URL,
        {
            contents: [{ parts: [{ text: SUMMARY_PROMPT(notesText) }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
        },
        { timeout: 15000 }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');

    return text;
}

module.exports = { generateSummary };
