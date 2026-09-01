/**
 * Triage prompt — single source of truth for the Gemini AI triage instruction.
 *
 * Used by:
 *   - backend/src/services/triageService.js (WhatsApp bot)
 *   - frontend/src/pages/patient/AiTriage.jsx (web dashboard — uses its own inline copy for now)
 *
 * Keep both prompts byte-identical. If you update this file, mirror the change
 * inside the `buildPrompt()` function in AiTriage.jsx.
 */

/**
 * @param {{ symptoms: string, duration?: string, severity?: string }} params
 * @returns {string} The ready-to-send Gemini prompt string
 */
function buildTriagePrompt({ symptoms, duration = 'not specified', severity = 'not specified' }) {
    return `You are a medical triage assistant for Sanjeevani, a rural India health platform.

A patient reports the following:
- Symptoms: ${symptoms}
- Duration: ${duration}
- Severity: ${severity}

Classify this into EXACTLY one of these three categories:
- "emergency" — requires immediate emergency care (ambulance / ER)
- "teleconsultation" — can be handled via video/phone consultation
- "doctor_visit" — should see a doctor in-person, but not an emergency

Respond with ONLY a valid JSON object in this exact format (no markdown, no extra text):
{"recommendation": "<one of: emergency|teleconsultation|doctor_visit>", "reason": "<one concise sentence explaining why>"}`;
}

module.exports = { buildTriagePrompt };
