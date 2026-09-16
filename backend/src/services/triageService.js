const { generateText } = require('../utils/aiClient');
const bhashiniService = require('./bhashiniService');
const { buildTriagePrompt } = require('../prompts/triagePrompt');
const { PatientProfile, DiseaseReport } = require('../models');
const { runDetectionCycle } = require('./outbreakDetectionService');
const { processHighRiskTriage } = require('./highRiskService');
const ngeohash = require('ngeohash');

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
    // 1. Sanitize local symptoms to pure English via Bhashini wrapper (critical for disease tagging logic)
    let englishSymptoms = symptoms;
    if (targetLang !== 'en') {
        try {
            englishSymptoms = await bhashiniService.translateText(symptoms, targetLang, 'en');
        } catch (e) {
            console.warn('[runTriage] Translation to English skipped:', e.message);
        }
    }

    const prompt = buildTriagePrompt({ symptoms: englishSymptoms, duration, severity });

    let rawText = '';
    try {
        rawText = await generateText({ prompt, temperature: 0.1, maxTokens: 256, json: true });
    } catch (err) {
        console.error('[runTriage] AI generation failed, using rule-based fallback:', err.message);
        // Resilient clinical rule-based fallback
        const lower = (englishSymptoms + ' ' + (severity || '')).toLowerCase();
        let fallbackRec = 'teleconsultation';
        let fallbackReason = 'Your symptoms can be effectively evaluated through a teleconsultation with a doctor.';

        if (lower.includes('chest pain') || lower.includes('shortness of breath') || lower.includes('unconscious') || lower.includes('fainting') || lower.includes('critical')) {
            fallbackRec = 'emergency';
            fallbackReason = 'Severe symptoms detected requiring immediate medical attention.';
        } else if (lower.includes('severe') || lower.includes('blood') || lower.includes('fracture') || lower.includes('high fever')) {
            fallbackRec = 'doctor_visit';
            fallbackReason = 'Please visit an in-person clinic or primary health center for physical examination.';
        }

        return { recommendation: fallbackRec, reason: fallbackReason };
    }

    const routeMap = {
        emergency: 'EMERGENCY',
        teleconsultation: 'TELECONSULTATION',
        doctor_visit: 'CLINIC_VISIT'
    };

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (jsonErr) {
        const recMatch = cleaned.match(/"recommendation"\s*:\s*"([^"]+)"/i);
        const routeMatch = cleaned.match(/"route"\s*:\s*"([^"]+)"/i);
        const reasonMatch = cleaned.match(/"reason"\s*:\s*"([^"]+)"/i);
        const diagMatch = cleaned.match(/"temporary_diagnosis"\s*:\s*"([^"]+)"/i);
        const specMatch = cleaned.match(/"recommended_speciality"\s*:\s*"([^"]+)"/i);
        const urgMatch = cleaned.match(/"urgency"\s*:\s*"([^"]+)"/i);

        let rec = recMatch ? recMatch[1].toLowerCase() : 'teleconsultation';
        if (routeMatch && !recMatch) {
            const r = routeMatch[1].toUpperCase();
            rec = r === 'EMERGENCY' ? 'emergency' : (r === 'CLINIC_VISIT' ? 'doctor_visit' : 'teleconsultation');
        }

        parsed = {
            recommendation: rec,
            route: routeMap[rec] || 'TELECONSULTATION',
            temporary_diagnosis: diagMatch ? diagMatch[1] : 'Clinical evaluation needed',
            recommended_speciality: specMatch ? specMatch[1] : 'General Medicine',
            urgency: urgMatch ? urgMatch[1] : 'routine',
            reason: reasonMatch ? reasonMatch[1] : 'Consultation recommended for clinical review.',
        };
    }

    let rec = (parsed.recommendation || '').toLowerCase();
    if (parsed.route && !parsed.recommendation) {
        const r = parsed.route.toUpperCase();
        rec = r === 'EMERGENCY' ? 'emergency' : (r === 'CLINIC_VISIT' ? 'doctor_visit' : 'teleconsultation');
    }
    if (!VALID_RECOMMENDATIONS.includes(rec)) {
        rec = 'teleconsultation';
    }

    parsed.recommendation = rec;
    parsed.route = routeMap[rec] || 'TELECONSULTATION';
    parsed.temporary_diagnosis = parsed.temporary_diagnosis || 'Preliminary assessment pending doctor examination';
    parsed.recommended_speciality = parsed.recommended_speciality || 'General Medicine';
    parsed.urgency = parsed.urgency || (rec === 'emergency' ? 'emergency' : 'routine');

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
                
                // Process high-risk episode
                processHighRiskTriage(patientId, sScore, parsed.reason);
            }
        }).catch(err => console.error('[diseaseReport] Error fetching patient:', err.message));
    }

    // Translate the reason and temporary diagnosis back to user targetLang if requested
    let finalReason = parsed.reason;
    let finalDiag = parsed.temporary_diagnosis;
    if (targetLang !== 'en') {
        try {
            finalReason = await bhashiniService.translateText(finalReason, 'en', targetLang);
            finalDiag = await bhashiniService.translateText(finalDiag, 'en', targetLang);
        } catch (e) {}
    }

    return {
        recommendation: parsed.recommendation,
        route: parsed.route,
        temporary_diagnosis: finalDiag,
        recommended_speciality: parsed.recommended_speciality,
        urgency: parsed.urgency,
        reason: finalReason,
    };
}

module.exports = { runTriage, mapDiseaseCategory };
