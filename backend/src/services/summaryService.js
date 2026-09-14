const { generateText } = require('../utils/aiClient');

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

    try {
        const text = await generateText({
            prompt: SUMMARY_PROMPT(notesText),
            temperature: 0.2,
            maxTokens: 256,
        });

        return text || null;
    } catch (err) {
        console.error('[generateSummary] Summary generation error:', err.message);
        return null;
    }
}

module.exports = { generateSummary };
