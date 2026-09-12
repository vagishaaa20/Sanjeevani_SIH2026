import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    ArrowRight,
    Mic,
    MicOff,
    Loader2,
    ShieldCheck,
    AlertTriangle,
    Video,
    Building2,
    RotateCcw,
    Sparkles,
    Activity,
    Info,
    CheckCircle2,
    Briefcase,
    Bed,
    AlertCircle,
    Clock,
    Flame
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/LanguageContext';

const DURATION_OPTIONS = [
    { label: 'Today', value: 'Today' },
    { label: '2–3 days', value: '2–3 days' },
    { label: 'More than a week', value: 'More than a week' },
    { label: 'Ongoing / Chronic', value: 'Ongoing' }
];

const FUNCTIONAL_IMPACT_OPTIONS = [
    {
        id: 'mild',
        label: 'Can still work & function',
        desc: 'Minor or manageable discomfort; routine activities unaffected.',
        icon: Briefcase,
        value: 'mild (can still work and function)'
    },
    {
        id: 'moderate',
        label: 'Has affected my ability to work',
        desc: 'Difficulty concentrating, reduced mobility, or fatigue.',
        icon: AlertCircle,
        value: 'moderate (has affected ability to work)'
    },
    {
        id: 'severe',
        label: 'Complete bed rest required',
        desc: 'Unable to get out of bed or carry out daily essentials.',
        icon: Bed,
        value: 'severe (complete bed rest required)'
    },
    {
        id: 'critical',
        label: 'Severe / Emergency distress',
        desc: 'Unbearable pain, shortness of breath, or sudden fainting.',
        icon: AlertTriangle,
        value: 'critical (severe emergency distress)'
    }
];

const LOADING_PHASES = [
    'Reviewing your symptoms',
    'Understanding symptom severity',
    'Assessing functional impact',
    'Preparing clinical next-step guidance'
];

export const AiTriage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { currentLang } = useLanguage();

    // Core triage state
    const [symptoms, setSymptoms] = useState('');
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
    const [result, setResult] = useState(null); // { recommendation, reason }
    const [error, setError] = useState('');

    // Voice triage state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcribing, setTranscribing] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);
    const textareaRef = useRef(null);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, []);

    // Stop recording automatically if it hits 60 seconds
    useEffect(() => {
        if (isRecording && recordingTime >= 60) {
            stopRecording();
        }
    }, [recordingTime, isRecording]);

    // Calm multi-phase loading progress
    useEffect(() => {
        let interval;
        if (loading) {
            setLoadingPhaseIndex(0);
            interval = setInterval(() => {
                setLoadingPhaseIndex((prev) => (prev < LOADING_PHASES.length - 1 ? prev + 1 : prev));
            }, 1200);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading]);

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
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            // Stop all tracks on the stream to release hardware cleanly
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
    };

    const handleRecordingStop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'triage_voice.webm');

        setTranscribing(true);
        setError('');

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/triage/voice`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data?.transcript) {
                setSymptoms((prev) => (prev ? `${prev.trim()} ${res.data.transcript}` : res.data.transcript));
            }
        } catch (err) {
            console.error('Transcription error:', err);
            setError('Voice transcription failed. Please enter your symptoms manually.');
        } finally {
            setTranscribing(false);
        }
    };

    const handleCheck = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setResult(null);

        if (!symptoms.trim()) {
            setError('Please describe your symptoms before proceeding with triage.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/triage`,
                {
                    symptoms,
                    duration,
                    severity,
                    targetLang: currentLang,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data?.recommendation) {
                setResult({
                    recommendation: response.data.recommendation,
                    reason: response.data.reason,
                });
            } else {
                setError('Received unknown response format from clinical analysis.');
            }
        } catch (err) {
            console.error('Triage Error:', err);
            setError('Failed to analyze symptoms. Please try again. (' + (err.response?.data?.error || err.message) + ')');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSymptoms('');
        setDuration('');
        setSeverity('');
        setResult(null);
        setError('');
    };

    const handleCtaAction = (recommendation) => {
        if (recommendation === 'emergency') {
            navigate('/patient/dashboard');
        } else if (recommendation === 'teleconsultation') {
            navigate('/patient/book-appointment');
        } else {
            navigate('/patient/doctors');
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left relative max-w-3xl mx-auto pb-16 animate-fade-in-up">
            {/* Subtle Sanjeevani ambient background glow */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 pointer-events-none -z-10"
                style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 0%, var(--hover-bg), transparent)' }}
            />

            {/* Top Navigation & Back */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => navigate('/patient/dashboard')}
                    className="inline-flex items-center gap-2 text-xs font-bold transition cursor-pointer px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow-xs"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Dashboard</span>
                </button>

                <div
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-2xs"
                    style={{ background: 'var(--accent-light)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Clinical AI Triage Gateway</span>
                </div>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                    CLINICAL TRIAGE
                </span>
                <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    What are you experiencing?
                </h1>
                <p className="text-xs sm:text-sm font-semibold max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Describe your symptoms in your own words. Sanjeevani will help determine the appropriate next step.
                </p>
            </div>

            {/* Main Clinical Card Container */}
            <div
                className="rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-8 relative"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                {!result ? (
                    <form onSubmit={handleCheck} className="flex flex-col gap-8">
                        {/* Section 1: Describe Symptoms */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xs font-black tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                                        1. Describe your symptoms <span className="text-rose-500">*</span>
                                    </h2>
                                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Mention where it hurts, how it feels, or any specific discomfort.
                                    </p>
                                </div>

                                {/* Voice Input Action in Header */}
                                <button
                                    type="button"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={transcribing || loading}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs`}
                                    aria-label="Voice input for symptoms"
                                    style={
                                        isRecording
                                            ? { background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }
                                            : transcribing
                                                ? { background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--notif-unread-border)' }
                                                : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                                    }
                                >
                                    {isRecording ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full animate-ping" style={{ background: 'var(--accent)' }} />
                                            <span>Stop ({60 - recordingTime}s)</span>
                                        </>
                                    ) : transcribing ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Transcribing voice...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                            <span>Speak</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    id="symptoms-composer"
                                    ref={textareaRef}
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    placeholder="For example: severe headache since yesterday, mild fever, and sensitivity to light..."
                                    rows={4}
                                    required
                                    disabled={isRecording || transcribing || loading}
                                    className="w-full px-4 py-3.5 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 transition leading-relaxed disabled:opacity-60"
                                    style={{
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Section 2: Onset & Duration */}
                        <div className="flex flex-col gap-3 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xs font-black tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                                        2. How long have you felt this way?
                                    </h2>
                                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Approximate duration of symptom onset.
                                    </p>
                                </div>
                                <span
                                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                                    style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                >
                                    Optional
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {DURATION_OPTIONS.map((opt) => {
                                    const isSelected = duration === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setDuration(isSelected ? '' : opt.value)}
                                            className="py-2.5 px-3 rounded-2xl text-xs font-bold transition cursor-pointer border text-center flex items-center justify-center gap-1.5"
                                            style={
                                                isSelected
                                                    ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--notif-unread-border)' }
                                                    : { background: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }
                                            }
                                        >
                                            <Clock className="w-3.5 h-3.5" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }} />
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 3: Impact on Daily Life & Ability to Work */}
                        <div className="flex flex-col gap-3 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xs font-black tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                                        3. How is this affecting your daily routine &amp; ability to work?
                                    </h2>
                                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Select the option that best reflects your current functional state.
                                    </p>
                                </div>
                                <span
                                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                                    style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                >
                                    Optional
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {FUNCTIONAL_IMPACT_OPTIONS.map((opt) => {
                                    const isSelected = severity === opt.value;
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSeverity(isSelected ? '' : opt.value)}
                                            className="p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative"
                                            style={
                                                isSelected
                                                    ? { background: 'var(--accent-light)', borderColor: 'var(--notif-unread-border)' }
                                                    : { background: 'var(--card-bg)', borderColor: 'var(--border)' }
                                            }
                                        >
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition"
                                                style={
                                                    isSelected
                                                        ? { background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--notif-unread-border)' }
                                                        : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                                                }
                                            >
                                                <Icon className="w-4 h-4" />
                                            </div>

                                            <div className="flex flex-col gap-0.5 pr-4">
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}
                                                >
                                                    {opt.label}
                                                </span>
                                                <span className="text-[11px] font-medium leading-normal" style={{ color: 'var(--text-secondary)' }}>
                                                    {opt.desc}
                                                </span>
                                            </div>

                                            {isSelected && (
                                                <div className="absolute top-3.5 right-3.5">
                                                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Error Notice */}
                        {error && (
                            <div
                                className="p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2"
                                style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                            >
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Primary CTA & Reassurance */}
                        <div className="flex flex-col items-center gap-3 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                                type="submit"
                                disabled={loading || !symptoms.trim()}
                                className="w-full sm:w-auto min-w-[280px] px-8 py-3.5 rounded-full font-black text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer text-white"
                                style={{ background: 'var(--accent)' }}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        <span>{LOADING_PHASES[loadingPhaseIndex]}...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Analyze symptoms</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <p className="text-xs font-semibold text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
                                You'll receive guidance on the next appropriate step. This is not a medical diagnosis.
                            </p>
                        </div>
                    </form>
                ) : (
                    /* Refined Result State */
                    <div className="flex flex-col gap-6 animate-fade-in-up">
                        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                    TRIAGE EVALUATION
                                </span>
                                <h3 className="text-xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                                    Recommended next step
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer hover:opacity-80"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>New assessment</span>
                            </button>
                        </div>

                        {/* Emergency Result Card */}
                        {result.recommendation === 'emergency' && (
                            <div
                                className="rounded-3xl p-6 sm:p-8 flex flex-col gap-5"
                                style={{ background: 'var(--pastel-pink-bg)', border: '2px solid var(--accent)' }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                        style={{ background: '#ffe6ee', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                                    >
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                                            High Urgency
                                        </span>
                                        <h4 className="text-xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                                            Emergency Care Required
                                        </h4>
                                        <p className="text-sm font-semibold leading-relaxed mt-1" style={{ color: 'var(--text-primary)' }}>
                                            {result.reason}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className="p-4 rounded-2xl text-xs font-semibold flex items-center gap-2"
                                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                >
                                    <Info className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                                    <span>
                                        Please seek immediate emergency medical assistance at the nearest hospital or contact your local emergency response service (108 / 112).
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleCtaAction('emergency')}
                                    className="w-full py-3.5 rounded-full font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-white"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    <span>Return to Emergency Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Teleconsultation Result Card */}
                        {result.recommendation === 'teleconsultation' && (
                            <div
                                className="rounded-3xl p-6 sm:p-8 flex flex-col gap-5"
                                style={{ background: 'var(--accent-light)', border: '2px solid var(--notif-unread-border)' }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--notif-unread-border)', color: 'var(--accent)' }}
                                    >
                                        <Video className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                                            Appropriate Next Step
                                        </span>
                                        <h4 className="text-xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                                            Teleconsultation Recommended
                                        </h4>
                                        <p className="text-sm font-semibold leading-relaxed mt-1" style={{ color: 'var(--text-primary)' }}>
                                            {result.reason}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className="p-4 rounded-2xl text-xs font-semibold flex items-center gap-2"
                                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--pastel-mint-text)' }} />
                                    <span>
                                        A qualified doctor can review your symptoms remotely and prescribe medication or arrange a follow-up.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleCtaAction('teleconsultation')}
                                    className="w-full py-3.5 rounded-full font-black text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-white"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    <span>Book Teleconsultation</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Doctor Visit / In-Person Result Card */}
                        {result.recommendation === 'doctor_visit' && (
                            <div
                                className="rounded-3xl p-6 sm:p-8 flex flex-col gap-5"
                                style={{ background: 'var(--pastel-peach-bg)', border: '2px solid var(--pastel-peach-text)' }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--pastel-peach-text)' }}
                                    >
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--pastel-peach-text)' }}>
                                            In-Person Evaluation
                                        </span>
                                        <h4 className="text-xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                                            Doctor Visit Recommended
                                        </h4>
                                        <p className="text-sm font-semibold leading-relaxed mt-1" style={{ color: 'var(--text-primary)' }}>
                                            {result.reason}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className="p-4 rounded-2xl text-xs font-semibold flex items-center gap-2"
                                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    <Info className="w-4 h-4 shrink-0" style={{ color: 'var(--pastel-peach-text)' }} />
                                    <span>
                                        An in-person clinical examination at a verified clinic or hospital is suggested for comprehensive diagnostic evaluation.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleCtaAction('doctor_visit')}
                                    className="w-full py-3.5 rounded-full font-black text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-white"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    <span>Find Nearby Clinics &amp; Verified Doctors</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="p-3 text-center">
                            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                This clinical assessment is for informational guidance and does not constitute a binding diagnosis.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiTriage;
