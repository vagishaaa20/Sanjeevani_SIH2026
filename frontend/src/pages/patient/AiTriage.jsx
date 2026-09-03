import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/LanguageContext';

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
    const { token } = useAuth();
    const { currentLang } = useLanguage();

    // Core triage state
    const [symptoms, setSymptoms] = useState('');
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { recommendation, reason }
    const [error, setError] = useState('');

    // Voice triage state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcribing, setTranscribing] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => clearInterval(timerIntervalRef.current);
    }, []);

    // Stop recording automatically if it hits 60 seconds
    useEffect(() => {
        if (isRecording && recordingTime >= 60) {
            stopRecording();
        }
    }, [recordingTime, isRecording]);

    const startRecording = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = handleRecordingStop;

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerIntervalRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Microphone error:', err);
            setError('Microphone access denied. Please type your symptoms instead.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
            // Stop all tracks on the stream to drop the browser's red recording dot natively
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleRecordingStop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Prepare FormData
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'triage_voice.webm');

        setTranscribing(true);
        setError('');

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/triage/voice`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (res.data?.transcript) {
                // Append or set the transcript directly to the textarea
                setSymptoms((prev) => prev ? prev + ' ' + res.data.transcript : res.data.transcript);
            }
        } catch (err) {
            console.error('Transcription error:', err);
            setError('Voice transcription failed. Please fall back to typing your symptoms.');
        } finally {
            setTranscribing(false);
        }
    };

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

        setLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/triage`, {
                symptoms,
                duration,
                severity,
                targetLang: currentLang
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.recommendation) {
                setResult({
                    recommendation: response.data.recommendation,
                    reason: response.data.reason
                });
            } else {
                setError('Received unknown response format from API.');
            }
        } catch (err) {
            console.error('Triage Error:', err);
            setError('Failed to analyze symptoms. Please try again. (' + err.message + ')');
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
                    {/* Symptoms textarea + Voice Record Container */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider flex justify-between items-end">
                            <span>Describe your symptoms <span className="text-red-500">*</span></span>

                            {/* Voice Button */}
                            <button
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={transcribing}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${isRecording
                                    ? 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                                    : 'border-ink-black bg-white text-ink-black hover:bg-ink-black hover:text-white'
                                    } disabled:opacity-50`}
                            >
                                {isRecording ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                        Stop ({60 - recordingTime}s)
                                    </>
                                ) : transcribing ? (
                                    'Listening...'
                                ) : (
                                    '🎤 Speak Symptoms'
                                )}
                            </button>
                        </label>
                        <textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder="e.g. fever since 2 days, severe headache, body aches, no appetite..."
                            rows={4}
                            required
                            disabled={isRecording || transcribing}
                            className={`w-full px-4 py-3 rounded-xl border-2 border-ink-black bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cerulean ${(isRecording || transcribing) ? 'opacity-60 bg-cream-bg' : ''}`}
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
