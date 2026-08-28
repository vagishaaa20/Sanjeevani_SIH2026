// Stub triage logic. Replace runTriageAI's body with a real LLM/API call later —
// the return shape (urgency/guidance/confidence) is the only contract that matters.

const EMERGENCY_KEYWORDS = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding', 'stroke', 'seizure'];
const DOCTOR_VISIT_KEYWORDS = ['high fever', 'persistent', 'vomiting', 'severe pain', 'week'];

async function runTriageAI({ symptoms, duration, medicalHistory }) {
  const text = symptoms.toLowerCase();

  if (EMERGENCY_KEYWORDS.some((kw) => text.includes(kw))) {
    return {
      urgency: 'emergency',
      guidance: 'Symptoms described may indicate a medical emergency. Please seek immediate in-person emergency care.',
      confidence: 0.6,
    };
  }

  if (DOCTOR_VISIT_KEYWORDS.some((kw) => text.includes(kw))) {
    return {
      urgency: 'doctor_visit',
      guidance: 'Symptoms suggest an in-person examination would be safest. Please visit a doctor at your earliest convenience.',
      confidence: 0.55,
    };
  }

  return {
    urgency: 'teleconsultation',
    guidance: 'Symptoms appear mild. A teleconsultation should be sufficient to confirm and advise next steps.',
    confidence: 0.5,
  };
}

module.exports = { runTriageAI };