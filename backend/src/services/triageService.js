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

    const categories = {
        'Fever/Infectious': /\b(dengue|malaria|chikungunya|typhoid|fever|pyrexia|febrile|infx|sepsis|septic)\b/g,
        'Respiratory': /\b(cough|cold|pneumonia|asthma|breath|respiratory|urti|lrti|copd|wheez(e|ing)?|sob|dyspnea)\b/g,
        'Gastrointestinal': /\b(diarrhea|vomiting|stomach( ache)?|abdominal pain|nausea|gastric|food poisoning|n\/v(\/d)?|v\/d|gastroenteritis|gi|abd|bowel(s)?)\b/g,
        'Skin/Allergic': /\b(rash|skin|itch(ing|y)?|allergy|allergic|measles|dermatitis|maculopapular|urticaria)\b/g,
        'Ophthalmological': /\b(eye(s)?|vision|conjunctivitis|conjunctival|sclera|cornea)\b/g,
        'Neurological': /\b(headache|migraine|dizzy|dizziness|faint|stroke|cephalgia|neuro|seizure|syncope)\b/g,
        'Cardiovascular': /\b(heart|cardiac|palpitation(s)?|tachycardia|bradycardia|arrhythmia|chest pain)\b/g
    };

    const negationWords = /\b(denies|denied|no|not|negative|without|unremarkable|afebrile|non-tender|nil|absent|rules out|r\/o)\b/i;

    let bestCategory = 'Other';
    let maxHits = 0;

    // Tie-resolution: the highest hit count wins. In the event of a tie, 
    // deterministic array ordering takes precedent (Fever > Resp > GI > etc)
    for (const [category, regex] of Object.entries(categories)) {
        const matches = [...text.matchAll(regex)];
        let validHits = 0;

        for (const match of matches) {
            // Scope limit of ~200 characters backward to support long enumerated lists
            const prevContextOffset = Math.max(0, match.index - 200);
            const prevContextStr = text.substring(prevContextOffset, match.index);

            // Break at logical polarity flippers or hard sentence breaks (but explicitly NOT "and"/"or")
            const clauseBoundaryRegex = /[\.;\n]|\b(but|however|admits|reports|pt has|patient has|c\/o|complains of|presents with|endorses|positive for|states|noted)\b/gi;
            const boundaries = [...prevContextStr.matchAll(clauseBoundaryRegex)];

            let relevantContext = prevContextStr;
            let hasAnchoringBoundary = false;

            if (boundaries.length > 0) {
                hasAnchoringBoundary = true;
                // Read from the last boundary to the keyword
                const lastBoundary = boundaries[boundaries.length - 1].index;
                relevantContext = prevContextStr.substring(lastBoundary + 1);
            }

            const isNegated = negationWords.test(relevantContext);

            // Safety valve for public-health-signal: if an extracted symptom has absolutely no punctuation
            // anchors and no clinical positive/negative verbs in its active window, log it for human audit
            // rather than trusting the silent positive default blindly.
            if (!hasAnchoringBoundary && !isNegated && prevContextStr.split(' ').length > 4) {
                console.warn(`[OUTBREAK_REVIEW_QUEUE] Unanchored/Ambiguous symptom match detected: "${match[0]}". Routing to manual clinical audit.`);
            }

            // If there's a negation word within the active clause context, discard the hit!
            if (!isNegated) {
                validHits++;
            }
        }

        if (validHits > maxHits) {
            maxHits = validHits;
            bestCategory = category;
        }
    }

    return bestCategory;
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
                    severityScore: sScore,
                    confidenceLevel: 'reported'
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

module.exports = { runTriage, mapDiseaseCategory };
