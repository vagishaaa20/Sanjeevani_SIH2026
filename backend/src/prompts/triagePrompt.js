/**
 * Triage prompt — single source of truth for the AI triage instruction.
 *
 * Used by:
 *   - backend/src/services/triageService.js
 *   - frontend/src/pages/patient/AiTriage.jsx
 */

/**
 * @param {{ symptoms: string, duration?: string, severity?: string }} params
 * @returns {string} The ready-to-send prompt string
 */
function buildTriagePrompt({ symptoms, duration = 'not specified', severity = 'not specified' }) {
    return `You are an expert clinical triage assistant for Sanjeevani, a healthcare platform for rural and urban India.

A patient reports the following:
- Symptoms: ${symptoms}
- Duration: ${duration}
- Severity: ${severity}

Analyze the clinical presentation carefully.
1. Classify the care pathway into EXACTLY one of these routes:
   - "emergency" (or "EMERGENCY") — acute life/organ threat requiring immediate ER / ambulance dispatch
   - "teleconsultation" (or "TELECONSULTATION") — non-emergency conditions safely manageable via video/phone consultation
   - "doctor_visit" (or "CLINIC_VISIT") — requires physical examination, vitals check, or in-person clinic visit, but non-emergent
2. Provide a temporary triage-level suspected condition / working diagnosis (for routing only, not final).
3. Recommend the most appropriate medical speciality (e.g., "General Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "ENT", "Gynecology", "Neurology", "Gastroenterology", "Pulmonology", "Ophthalmology").
4. Determine urgency ("routine", "urgent", or "emergency").
5. Provide a one-sentence clear explanation reason for the patient.

Respond with ONLY a valid JSON object in this exact format (no markdown, no backticks, no extra preamble):
{
  "recommendation": "<emergency|teleconsultation|doctor_visit>",
  "route": "<EMERGENCY|TELECONSULTATION|CLINIC_VISIT>",
  "temporary_diagnosis": "<concise suspected condition>",
  "recommended_speciality": "<medical speciality>",
  "urgency": "<routine|urgent|emergency>",
  "reason": "<one concise patient-friendly sentence explaining why>"
}`;
}

module.exports = { buildTriagePrompt };
