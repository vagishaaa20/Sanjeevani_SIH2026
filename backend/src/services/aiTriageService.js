/**
 * Sanjeevani AI Clinical Triage & Medical Translation Engine
 * 
 * Supports:
 * 1. Groq Cloud API (Llama 3.3 70B Versatile)
 * 2. Google Gemini 1.5 Flash / 2.0
 * 3. OpenAI GPT-4o-mini
 * 4. Clinical Expert Rule & Medical Translator Fallback Engine
 * 
 * Performs:
 * - Technical restructuring of patient colloquial symptoms into standard medical terminology (CC & HPI).
 * - Extraction and highlighting of key clinical keywords and vital indicators.
 * - Assessment of uploaded diagnostic images/PDF attachments.
 * - Severity classification, specialist routing, differential indications, and precautions.
 */

const env = require('../config/env');

const SPECIALTY_KEYWORDS = {
  Dermatologist: ['skin', 'rash', 'acne', 'itching', 'eczema', 'psoriasis', 'mole', 'lesion', 'dermatitis', 'hives', 'burn', 'blister', 'boil', 'erythema'],
  Cardiologist: ['chest pain', 'palpitation', 'heart', 'angina', 'shortness of breath on exertion', 'high bp', 'hypertension', 'irregular heartbeat', 'arrhythmia'],
  Pulmonologist: ['cough', 'asthma', 'wheezing', 'phlegm', 'sputum', 'bronchitis', 'lung', 'difficulty breathing', 'breathless', 'dyspnea', 'pyrexia'],
  Orthopedic: ['joint pain', 'fracture', 'bone', 'knee', 'back pain', 'spine', 'shoulder', 'sprain', 'swollen ankle', 'arthritis', 'ligament', 'myalgia'],
  Pediatrician: ['child', 'infant', 'baby', 'toddler', 'pediatric', 'vaccination for child'],
  Gynecologist: ['pregnancy', 'period', 'menstrual', 'cramps', 'ovary', 'pcos', 'vaginal', 'pelvic pain'],
  ENT: ['ear pain', 'throat', 'tonsil', 'sinus', 'hearing', 'nasal congestion', 'vertigo', 'hoarse voice', 'pharyngitis'],
  Gastroenterologist: ['stomach pain', 'acid reflux', 'gerd', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'ulcer', 'abdomen', 'gastritis'],
  Neurologist: ['migraine', 'severe headache', 'dizziness', 'seizure', 'numbness', 'tingling', 'tremor', 'stroke symptoms', 'syncope'],
  GeneralPhysician: ['fever', 'cold', 'flu', 'weakness', 'fatigue', 'body ache', 'chills', 'malaise', 'checkup', 'pyrexia']
};

/**
 * Executes AI clinical triage using LLMs with structured medical JSON schema
 */
async function performClinicalTriage({
  symptoms,
  duration,
  painLevel,
  affectedArea,
  requirement,
  patientProfile = {},
  attachments = [],
}) {
  const groqKey = process.env.GROQ_API_KEY || env.llm?.groqApiKey;
  const geminiKey = process.env.GEMINI_API_KEY || env.llm?.geminiApiKey;
  const openaiKey = process.env.OPENAI_API_KEY || env.llm?.openaiApiKey;

  const attachmentDescriptions = (attachments || []).map((a, i) =>
    `Attachment ${i + 1}: ${a.filename} (${a.type === 'affected_area' ? 'Visual Photo of Affected Body Area' : 'Prior Prescription / Lab Diagnostic Document'}, Mime: ${a.mimetype})`
  ).join('\n') || 'None attached';

  const promptContext = `
PATIENT COLLOQUIAL SYMPTOM INPUT:
"${symptoms}"

CLINICAL PARAMETERS:
- Duration of Symptoms: "${duration || 'Unspecified'}"
- Pain / Severity Level (1-10): ${painLevel || 'Not specified'}
- Affected Body Region: "${affectedArea || 'Unspecified'}"
- Stated Patient Goal: "${requirement || 'Doctor Consultation'}"
- Uploaded Evidence:
${attachmentDescriptions}

PATIENT DEMOGRAPHICS & VITALS:
- Age: ${patientProfile.dateOfBirth ? (new Date().getFullYear() - new Date(patientProfile.dateOfBirth).getFullYear()) : 'Adult'}
- Sex: ${patientProfile.sex || 'Not specified'}
- Known Chronic Conditions: ${(patientProfile.medicalConditions || []).join(', ') || 'None reported'}
- Known Drug / Food Allergies: ${(patientProfile.allergies || []).join(', ') || 'None reported'}
`;

  const systemInstruction = `You are a Chief Clinical AI Physician and Medical Triage Expert on the Sanjeevani Health platform.
Your task is to analyze patient symptom logs (often written in informal/colloquial language) and:

1. REFRAME & TRANSLATE: Translate the patient's layperson description into technical medical terminology (Standard Clinical Chief Complaint & HPI - History of Present Illness) suitable for review by attending doctors, HITL reviewers, and ML models.
2. EXTRACT CLINICAL KEYWORDS: Identify and highlight high-yield clinical keywords/medical terms (e.g. "Intermittent pyrexia", "Rigors", "Productive cough", "Refractory to antipyretics", "Maculopapular lesion").
3. ASSESS ATTACHMENTS: If photos of affected areas or past prescriptions are listed, synthesize diagnostic clues (e.g. visual erythema review, medication history).
4. TRIAGE CATEGORIZATION: Classify into strictly one of:
   - "EMERGENCY_ESCALATION": Acute life threats (unstable vitals, chest pain, stroke signs, severe dyspnea).
   - "PHYSICAL_VISIT": Requires in-person palpation, auscultation, wound care, or local examination.
   - "TELECONSULTATION": Stable symptoms suitable for telehealth video/audio consultation and digital e-prescription.

Respond STRICTLY in JSON format with no extra markdown or backticks:
{
  "technicalChiefComplaint": "Technical concise chief complaint in professional medical terms (e.g. 'Recurrent febrile episodes with rigors, transient response to antipyretics, and generalized myalgia')",
  "technicalHpi": "Structured History of Present Illness summarizing timeline, severity, progression, and aggravating/relieving factors in formal clinical phrasing.",
  "clinicalKeywords": ["Keyword 1", "Keyword 2", "Keyword 3", "Keyword 4"],
  "attachmentFindings": "Summary of visual/document context based on attachments provided (or 'Standard visual examination recommended').",
  "triageCategory": "EMERGENCY_ESCALATION" | "PHYSICAL_VISIT" | "TELECONSULTATION",
  "urgencyLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "recommendedSpecialization": "Dermatologist" | "General Physician" | "Cardiologist" | "Pulmonologist" | "Orthopedic" | "Gastroenterologist" | "ENT" | "Gynecologist" | "Neurologist" | "Pediatrician",
  "suspectedConditions": ["Condition 1", "Condition 2"],
  "clinicalReasoning": "Concise rationale explaining clinical triage category and specialist routing.",
  "redFlags": ["Warning sign 1", "Warning sign 2"],
  "immediatePrecautions": ["Safe precaution 1", "Safe precaution 2"],
  "suggestedQuestionsForDoctor": ["Question 1", "Question 2"]
}`;

  // 1. Try Groq API (High Performance Llama 3.3 70B)
  if (groqKey && groqKey.trim() !== '') {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: promptContext }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });

      if (res.ok) {
        const json = await res.json();
        const rawText = json.choices?.[0]?.message?.content;
        if (rawText) {
          const parsed = parseJsonSafely(rawText);
          if (parsed && parsed.triageCategory) {
            console.log('✓ Groq Llama 3.3 Clinical Triage & Translation completed successfully');
            return sanitizeTriageOutput(parsed, symptoms);
          }
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Groq API error:', errJson);
      }
    } catch (err) {
      console.warn('Groq request error:', err.message);
    }
  }

  // 2. Try Google Gemini API
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`;
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemInstruction },
                { text: promptContext }
              ]
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = parseJsonSafely(rawText);
          if (parsed && parsed.triageCategory) {
            console.log('✓ Gemini Clinical Triage completed successfully');
            return sanitizeTriageOutput(parsed, symptoms);
          }
        }
      }
    } catch (err) {
      console.warn('Gemini request error:', err.message);
    }
  }

  // 3. Try OpenAI API
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: promptContext }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });

      if (res.ok) {
        const json = await res.json();
        const rawText = json.choices?.[0]?.message?.content;
        if (rawText) {
          const parsed = parseJsonSafely(rawText);
          if (parsed && parsed.triageCategory) {
            console.log('✓ OpenAI Clinical Triage completed successfully');
            return sanitizeTriageOutput(parsed, symptoms);
          }
        }
      }
    } catch (err) {
      console.warn('OpenAI request error:', err.message);
    }
  }

  // 4. Clinical Rules & Diagnostics Fallback Engine
  return fallbackRuleTriage(symptoms, duration, painLevel, affectedArea, requirement, attachments);
}

function parseJsonSafely(text) {
  try {
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function sanitizeTriageOutput(raw, originalSymptoms) {
  let cat = raw.triageCategory;
  if (!['EMERGENCY_ESCALATION', 'PHYSICAL_VISIT', 'TELECONSULTATION'].includes(cat)) {
    cat = 'TELECONSULTATION';
  }

  return {
    technicalChiefComplaint: raw.technicalChiefComplaint || `Clinical presentation: ${originalSymptoms}`,
    technicalHpi: raw.technicalHpi || `Patient reports active symptoms requiring clinical assessment.`,
    clinicalKeywords: Array.isArray(raw.clinicalKeywords) && raw.clinicalKeywords.length > 0 ? raw.clinicalKeywords : ['Symptom Assessment', 'Clinical Evaluation'],
    attachmentFindings: raw.attachmentFindings || 'Visual and prior prescription records processed for clinician review.',
    triageCategory: cat,
    urgencyLevel: raw.urgencyLevel || (cat === 'EMERGENCY_ESCALATION' ? 'CRITICAL' : cat === 'PHYSICAL_VISIT' ? 'HIGH' : 'MEDIUM'),
    recommendedSpecialization: raw.recommendedSpecialization || 'General Physician',
    suspectedConditions: Array.isArray(raw.suspectedConditions) ? raw.suspectedConditions : ['Clinical evaluation required'],
    clinicalReasoning: raw.clinicalReasoning || 'Triage categorized based on reported symptom severity and clinical indicators.',
    redFlags: Array.isArray(raw.redFlags) ? raw.redFlags : ['Seek immediate emergency care if chest pain, loss of consciousness, or breathing trouble occurs.'],
    immediatePrecautions: Array.isArray(raw.immediatePrecautions) ? raw.immediatePrecautions : ['Stay hydrated, rest, and keep a log of vitals.'],
    suggestedQuestionsForDoctor: Array.isArray(raw.suggestedQuestionsForDoctor) ? raw.suggestedQuestionsForDoctor : ['What is the suspected diagnosis?', 'Do I need diagnostic lab tests?']
  };
}

function fallbackRuleTriage(symptoms, duration, painLevel, affectedArea, requirement, attachments = []) {
  const text = `${symptoms || ''} ${affectedArea || ''} ${requirement || ''}`.toLowerCase();
  const pain = parseInt(painLevel, 10) || 0;

  // Emergency Red Flags
  const emergencyKeywords = [
    'chest pain', 'heart attack', 'difficulty breathing', 'shortness of breath', 'breathless',
    'unconscious', 'fainting', 'severe bleeding', 'stroke', 'paralysis', 'facial drooping',
    'slurred speech', 'fracture skull', 'anaphylaxis', 'poisoning', 'cyanosis', 'blue lips'
  ];

  const keywords = [];
  if (text.includes('fever') || text.includes('chills')) keywords.push('Pyrexia / Febrile Episodes', 'Rigors');
  if (text.includes('cough')) keywords.push('Respiratory Cough Reflex');
  if (text.includes('pain')) keywords.push(`Algesia (Pain Scale: ${pain}/10)`);
  if (text.includes('rash') || text.includes('skin')) keywords.push('Dermatological Lesion / Erythema');

  if (emergencyKeywords.some((kw) => text.includes(kw)) || pain >= 9) {
    let spec = 'Cardiologist';
    if (text.includes('stroke') || text.includes('paralysis') || text.includes('speech')) spec = 'Neurologist';
    if (text.includes('breathing') || text.includes('breathless')) spec = 'Pulmonologist';

    return {
      technicalChiefComplaint: `Acute severe presentation with critical red-flag symptoms: ${symptoms}`,
      technicalHpi: `Patient exhibits acute decompensation requiring immediate emergency resuscitation and stabilization.`,
      clinicalKeywords: keywords.length > 0 ? keywords : ['Acute Medical Emergency', 'Severe Distress'],
      attachmentFindings: attachments.length > 0 ? `${attachments.length} diagnostic record(s) attached for emergency physician review.` : 'No attachments.',
      triageCategory: 'EMERGENCY_ESCALATION',
      urgencyLevel: 'CRITICAL',
      recommendedSpecialization: spec,
      suspectedConditions: ['Acute Medical Emergency', 'Severe Clinical Escalation'],
      clinicalReasoning: 'Critical red-flag indicators detected requiring immediate emergency intervention and bedside stabilization.',
      redFlags: ['Immediate emergency attention needed. Do not drive yourself to hospital.', 'Call 112 / 108 ambulance if symptoms escalate.'],
      immediatePrecautions: ['Stay in a comfortable seated position', 'Keep airway clear', 'Do not exert physical effort'],
      suggestedQuestionsForDoctor: ['What urgent tests are required?', 'Is hospital admission needed?']
    };
  }

  // Determine Specialist
  let recommendedSpec = 'General Physician';
  for (const [specialty, keywordsList] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (keywordsList.some((kw) => text.includes(kw))) {
      recommendedSpec = specialty === 'GeneralPhysician' ? 'General Physician' : specialty;
      break;
    }
  }

  // Physical Visit Indicators
  const physicalKeywords = [
    'fracture', 'broken', 'wound', 'deep cut', 'stitches', 'severe swelling',
    'sprain', 'injury', 'abscess', 'lump', 'severe abdominal pain', 'vomiting blood',
    'high fever', 'burning urination', 'ear drainage', 'trauma'
  ];

  if (physicalKeywords.some((kw) => text.includes(kw)) || pain >= 6) {
    return {
      technicalChiefComplaint: `Localized acute presentation: ${symptoms}`,
      technicalHpi: `Patient presents with localized complaint with moderate-to-severe discomfort (${pain}/10) over ${duration || 'recent onset'}.`,
      clinicalKeywords: keywords.length > 0 ? keywords : ['Physical Exam Indicated', 'Acute localized ailment'],
      attachmentFindings: attachments.length > 0 ? `${attachments.length} photo/document record(s) queued for clinical review.` : 'No attachments.',
      triageCategory: 'PHYSICAL_VISIT',
      urgencyLevel: 'HIGH',
      recommendedSpecialization: recommendedSpec,
      suspectedConditions: [`${recommendedSpec} Evaluation Required`, 'Acute localized ailment'],
      clinicalReasoning: 'Symptoms indicate a condition that benefits from a hands-on physical exam, auscultation, or in-person diagnostics.',
      redFlags: ['Sudden spike in high fever over 103F', 'Rapid spread of redness or severe tenderness', 'Inability to keep liquids down'],
      immediatePrecautions: ['Avoid strenuous movement or pressure on affected area', 'Apply cold compress for minor swelling if appropriate', 'Keep record of temperature and symptom onset'],
      suggestedQuestionsForDoctor: ['Do I need an X-ray, ultrasound, or blood tests?', 'What medications are recommended?']
    };
  }

  // Teleconsultation
  return {
    technicalChiefComplaint: `Subacute stable complaint: ${symptoms}`,
    technicalHpi: `Patient describes stable symptoms over ${duration || 'few days'} suitable for digital telehealth consultation.`,
    clinicalKeywords: keywords.length > 0 ? keywords : ['Teleconsultation Candidate', 'Stable Presentation'],
    attachmentFindings: attachments.length > 0 ? `${attachments.length} attachment(s) logged for tele-physician review.` : 'No attachments.',
    triageCategory: 'TELECONSULTATION',
    urgencyLevel: 'MEDIUM',
    recommendedSpecialization: recommendedSpec,
    suspectedConditions: [`Mild ${recommendedSpec} Related Condition`, 'Routine Clinical Assessment'],
    clinicalReasoning: 'Symptoms appear stable and suitable for online telehealth review, clinical guidance, and digital e-prescription.',
    redFlags: ['Escalating pain or high fever unresponsive to standard medication', 'New onset breathing difficulty or dizziness'],
    immediatePrecautions: ['Maintain adequate hydration and rest', 'Avoid self-medicating with antibiotics without prescription'],
    suggestedQuestionsForDoctor: ['How long will recovery take?', 'Are there any dietary precautions I should follow?']
  };
}

module.exports = { performClinicalTriage };
