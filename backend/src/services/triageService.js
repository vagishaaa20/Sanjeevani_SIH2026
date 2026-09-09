const axios = require('axios');
const bhashiniService = require('./bhashiniService');
const { buildTriagePrompt } = require('../prompts/triagePrompt');
const { PatientProfile, DiseaseReport } = require('../models');
const { runDetectionCycle } = require('./outbreakDetectionService');
const ngeohash = require('ngeohash');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const VALID_RECOMMENDATIONS = ['emergency', 'teleconsultation', 'doctor_visit'];

/**
 * Simple keyword mapper for disease categorization
 */
function mapDiseaseCategory(reasonText = '', symptoms = '') {
    const text = (reasonText + ' ' + symptoms).toLowerCase();
    if (text.match(/dengue|malaria|chikungunya|typhoid|fever/)) return 'Fever/Infectious';
    if (text.match(/cough|cold|pneumonia|asthma|breath|chest|respiratory/)) return 'Respiratory';
    if (text.match(/diarrhea|vomiting|stomach|pain|nausea|gastric|food poisoning/)) return 'Gastrointestinal';
    if (text.match(/rash|skin|itch|allergy|measles/)) return 'Skin/Allergic';
    if (text.match(/eye|vision|conjunctivitis/)) return 'Ophthalmological';
    if (text.match(/headache|migraine|dizzy|faint|stroke/)) return 'Neurological';
    if (text.match(/heart|cardiac|palpitation/)) return 'Cardiovascular';
    return 'Other';
}

/**
 * Calls Gemini to triage patient symptoms.
 *
 * @param {{ symptoms: string, duration?: string, severity?: string, patientId?: string }} params
 * @returns {Promise<{ recommendation: string, reason: string }>}
 * @throws {Error} if Gemini is unreachable, response is malformed, or key is missing
 */
async function runTriage({ symptoms, duration, severity, patientId, targetLang = 'en' }) {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment');
    }

    // 1. Sanitize local symptoms to pure English via Bhashini wrapper (critical for disease tagging logic)
    let englishSymptoms = symptoms;
    if (targetLang !== 'en') {
        englishSymptoms = await bhashiniService.translateText(symptoms, targetLang, 'en');
    }

    const prompt = buildTriagePrompt({ symptoms: englishSymptoms, duration, severity });

    const response = await axios.post(
        GEMINI_URL,
        {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        },
        { timeout: 15000 }
    );

    const rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!rawText) throw new Error('Empty response from Gemini');

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!VALID_RECOMMENDATIONS.includes(parsed.recommendation)) {
        throw new Error(`Unexpected recommendation: ${parsed.recommendation}`);
    }

    // Attempt to log disease report for outbreak detection (fire and forget)
    if (patientId) {
        PatientProfile.findByPk(patientId).then(async (patient) => {
            if (patient && patient.latitude && patient.longitude) {
                const diseaseCategory = mapDiseaseCategory(parsed.reason, englishSymptoms);
                const gh = ngeohash.encode(patient.latitude, patient.longitude, 5); // precision 5 = ~5km

                let sScore = 1;
                if (parsed.recommendation === 'emergency') sScore = 3;
                else if (parsed.recommendation === 'doctor_visit') sScore = 2;

                await DiseaseReport.create({
                    patientId,
                    diseaseCategory,
                    symptomTags: [englishSymptoms],
                    geohash: gh,
                    source: 'triage',
                    severityScore: sScore
                });

                // Asynchronously trigger detection
                runDetectionCycle().catch(err => console.error('[outbreakDetection] Error:', err.message));
            }
        }).catch(err => console.error('[diseaseReport] Error fetching patient:', err.message));
    }

    // Translate the reason block natively back into the user's localized targetLang!
    let finalReason = parsed.reason;
    if (targetLang !== 'en') {
        finalReason = await bhashiniService.translateText(finalReason, 'en', targetLang);
    }

    // Keep recommendation in English for downstream ENUM layout routing
    return { recommendation: parsed.recommendation, reason: finalReason };
}

module.exports = { runTriage };
