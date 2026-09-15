require('../config/env');
const axios = require('axios');
const Groq = require('groq-sdk');
const fs = require('fs');
const os = require('os');
const path = require('path');

function getGroq() {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    return new Groq({ apiKey: key });
}

/**
 * Generate text content using Gemini (if available) with automatic fallback to Groq.
 */
async function generateText({ prompt, temperature = 0.1, maxTokens = 512, json = false }) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groq = getGroq();

    // 1. Try Gemini if valid key is provided
    if (geminiKey && !geminiKey.startsWith('AQ.')) {
        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
            const res = await axios.post(
                geminiUrl,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature, maxOutputTokens: maxTokens },
                },
                { timeout: 12000 }
            );

            const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) return text;
        } catch (err) {
            console.warn('[aiClient] Gemini generation failed, falling back to Groq:', err.message);
        }
    }

    // 2. Fallback to Groq
    if (groq) {
        try {
            const completion = await groq.chat.completions.create({
                model: 'groq/compound-mini',
                messages: [
                    {
                        role: 'system',
                        content: json ? 'You are a precise clinical assistant. Always return ONLY valid JSON.' : 'You are a helpful medical assistant.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature,
                max_tokens: maxTokens,
            });

            const content = completion.choices?.[0]?.message?.content?.trim();
            if (content) return content;
        } catch (groqErr) {
            console.warn('[aiClient] Groq compound-mini failed, trying qwen3.6-27b:', groqErr.message);
            try {
                const completion = await groq.chat.completions.create({
                    model: 'qwen/qwen3.6-27b',
                    messages: [{ role: 'user', content: prompt }],
                    temperature,
                    max_tokens: maxTokens,
                });
                const content = completion.choices?.[0]?.message?.content?.trim();
                if (content) return content;
            } catch (qwenErr) {
                console.error('[aiClient] Groq fallback failed:', qwenErr.message);
            }
        }
    }

    throw new Error('All AI providers (Gemini, Groq) failed to generate response.');
}

/**
 * Transcribe audio using Groq Whisper with Gemini fallback.
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groq = getGroq();
    let tempFilePath = null;

    // 1. Try Groq Whisper (fast and accurate)
    if (groq) {
        try {
            const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : 'webm';
            tempFilePath = path.join(os.tmpdir(), `triage_voice_${Date.now()}.${ext}`);
            fs.writeFileSync(tempFilePath, audioBuffer);

            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-large-v3',
            });

            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

            if (transcription?.text?.trim()) {
                return transcription.text.trim();
            }
        } catch (groqWhisperErr) {
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            console.warn('[aiClient] Groq Whisper failed:', groqWhisperErr.message);
        }
    }

    // 2. Try Gemini audio transcription
    if (geminiKey && !geminiKey.startsWith('AQ.')) {
        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
            const base64Audio = audioBuffer.toString('base64');

            const res = await axios.post(
                geminiUrl,
                {
                    contents: [{
                        parts: [
                            { text: "Please transcribe this audio accurately. Return ONLY the spoken words." },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64Audio,
                                },
                            },
                        ],
                    }],
                    generationConfig: { temperature: 0.1 },
                },
                { timeout: 15000 }
            );

            const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) return text;
        } catch (geminiAudioErr) {
            console.warn('[aiClient] Gemini audio transcription failed:', geminiAudioErr.message);
        }
    }

    throw new Error('Speech transcription failed on all AI providers.');
}

module.exports = { generateText, transcribeAudio };
