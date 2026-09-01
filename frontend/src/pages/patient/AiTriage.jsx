import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ⚠️ SECURITY NOTE: This calls the Gemini API directly from the browser.
// VITE_GEMINI_API_KEY is exposed in the client bundle.
// Before production, move this to a backend proxy route (e.g. POST /api/ai/triage)
// so the key is never shipped to the client.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const RESULT_CONFIG = {
    emergency: {
        label: 'Emergency — Seek Immediate Care',
        bg: 'bg-red-50',
        border: 'border-red-400',
        text: 'text-red-800',
        icon: '🚨',
        cta: 'Find Nearest Emergency Room',
        ctaAction: 'er',
    },
    teleconsultation: {
        label: 'Teleconsultation Recommended',
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-800',
        icon: '📞',
        cta: 'Book Teleconsultation',
        ctaAction: 'book',
    },
    doctor_visit: {
        label: 'Doctor Visit Recommended',
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-800',
        icon: '🏥',
        cta: 'Book Doctor Visit',
        ctaAction: 'book',
    },
};

const AiTriage = () => {
    const navigate = useNavigate();

    const [symptoms, setSymptoms] = useState('');
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { recommendation, reason }
    const [error, setError] = useState('');

    const buildPrompt = () =>
        `You are a medical triage assistant for Sanjeevani, a rural India health platform.

A patient reports the following:
- Symptoms: ${symptoms}
- Duration: ${duration || 'not specified'}
- Severity: ${severity || 'not specified'}

Classify this into EXACTLY one of these three categories:
- "emergency" — requires immediate emergency care (ambulance / ER)
- "teleconsultation" — can be handled via video/phone consultation
- "doctor_visit" — should see a doctor in-person, but not an emergency

Respond with ONLY a valid JSON object in this exact format (no markdown, no extra text):
{"recommendation": "<one of: emergency|teleconsultation|doctor_visit>", "reason": "<one concise sentence explaining why>"}`;

    const handleCheck = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);

        if (!symptoms.trim()) {
            setError('Please describe your symptoms before checking.');
            return;
        }

        if (!GEMINI_API_KEY) {
            setError('AI Triage is not configured (missing VITE_GEMINI_API_KEY). Please contact support.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: buildPrompt() }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || `Gemini API error ${response.status}`);
            }

            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (!rawText) throw new Error('Empty response from AI');

            // Parse JSON — strip any accidental markdown fencing
            const cleaned = rawText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            const validRecs = ['emergency', 'teleconsultation', 'doctor_visit'];
            if (!validRecs.includes(parsed.recommendation)) {
                throw new Error('Unexpected recommendation from AI: ' + parsed.recommendation);
            }

            setResult(parsed);
        } catch (err) {
            setError('Could not get an AI response. Please try again. (' + err.message + ')');
        } finally {
            setLoading(false);
        }
    };

    const handleCtaAction = (action) => {
        if (action === 'book') navigate('/patient/book-appointment');
        if (action === 'er') alert('Feature coming soon: nearest emergency room locator.');
    };

    const cfg = result ? RESULT_CONFIG[result.recommendation] : null;

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate('/patient/dashboard')}
                    className="text-ink-muted hover:text-ink-black font-semibold text-sm flex items-center gap-1 cursor-pointer transition-colors"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-black text-ink-black">AI Symptom Checker</h2>
            </div>

            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-ink-charcoal">
                        Describe your symptoms below and our AI will suggest whether you need emergency
                        care, a teleconsultation, or an in-person doctor visit.
                    </p>
                    <p className="text-xs text-ink-muted">
                        This is not a medical diagnosis. Always consult a qualified healthcare provider.
                    </p>
                </div>

                <form onSubmit={handleCheck} className="flex flex-col gap-4">
                    {/* Symptoms textarea */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                            Describe your symptoms <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder="e.g. fever since 2 days, severe headache, body aches, no appetite..."
                            rows={4}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-ink-black bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cerulean"
                        />
                    </div>

                    {/* Duration + Severity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                                Duration <span className="text-ink-muted">(optional)</span>
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-ink-black bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cerulean cursor-pointer"
                            >
                                <option value="">Select duration</option>
                                <option value="less than 1 day">Less than 1 day</option>
                                <option value="1-2 days">1–2 days</option>
                                <option value="3-7 days">3–7 days</option>
                                <option value="more than a week">More than a week</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                                Severity <span className="text-ink-muted">(optional)</span>
                            </label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-ink-black bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cerulean cursor-pointer"
                            >
                                <option value="">Select severity</option>
                                <option value="mild">Mild — manageable, minor discomfort</option>
                                <option value="moderate">Moderate — affecting daily activities</option>
                                <option value="severe">Severe — cannot function normally</option>
                                <option value="critical">Critical — unbearable or life-threatening</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 font-semibold">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl border-2 border-ink-black bg-ink-black text-white font-bold text-sm hover:bg-white hover:text-ink-black transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Analysing…
                            </span>
                        ) : (
                            '🔍 Check Symptoms'
                        )}
                    </button>
                </form>

                {/* Result banner */}
                {result && cfg && (
                    <div className={`flex flex-col gap-4 p-5 rounded-2xl border-2 ${cfg.bg} ${cfg.border}`}>
                        <div className="flex items-start gap-3">
                            <span className="text-3xl">{cfg.icon}</span>
                            <div>
                                <p className={`font-black text-base ${cfg.text}`}>{cfg.label}</p>
                                <p className={`text-sm mt-1 ${cfg.text} opacity-90`}>{result.reason}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCtaAction(cfg.ctaAction)}
                            className={`w-full py-2.5 rounded-xl border-2 font-bold text-sm cursor-pointer transition-all
                                ${cfg.ctaAction === 'er'
                                    ? 'border-red-600 bg-red-600 text-white hover:bg-white hover:text-red-600'
                                    : 'border-ink-black bg-ink-black text-white hover:bg-white hover:text-ink-black'
                                }`}
                        >
                            {cfg.cta}
                        </button>
                        <p className="text-xs text-ink-muted text-center">
                            Not a substitute for professional medical advice.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiTriage;
