const { runTriage } = require('../services/triageService');
const Groq = require('groq-sdk');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
async function performTriage(req, res) {
    try {
        const patientId = req.user.id;
        const { symptoms, duration, severity, targetLang } = req.body;

        if (!symptoms) {
            return res.status(400).json({ error: 'Symptoms are required' });
        }

        const result = await runTriage({ symptoms, duration, severity, patientId, targetLang });

        return res.json(result);
    } catch (err) {
        console.error('[triageController] Error:', err);
        return res.status(500).json({ error: err.message || 'Triage failed' });
    }
}

async function processVoiceTriage(req, res) {
    let tempFilePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const audioBuffer = req.file.buffer;
        const mimeType = req.file.mimetype || 'audio/webm';
        let transcribedText = null;

        // 1. PRIMARY ATTEMPT: Traverse via Gemini 2.0 Flash
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
                const base64Audio = audioBuffer.toString('base64');

                const geminiPayload = {
                    contents: [{
                        parts: [
                            { text: "Please accurately transcribe the following audio patient symptom description exactly as spoken. Return ONLY the transcribed text without any markdown, quotes, emojis, or conversational filler." },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Audio
                                }
                            }
                        ]
                    }],
                    generationConfig: { temperature: 0.1 }
                };

                const geminiRes = await axios.post(geminiUrl, geminiPayload, { timeout: 15000 });
                const rawText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

                if (rawText) {
                    transcribedText = rawText;
                    console.log('[processVoiceTriage] Successfully transcribed via Gemini.');
                }
            } catch (geminiError) {
                console.warn('[processVoiceTriage] Gemini transcription failed, falling back to Groq Whisper...', geminiError.message);
            }
        }

        // 2. SECONDARY FALLBACK: Groq Whisper-Large-V3 (if Gemini failed or has no key)
        if (!transcribedText) {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey) {
                return res.status(500).json({ error: 'Both GEMINI_API_KEY and GROQ_API_KEY are missing or failed.' });
            }

            const groq = new Groq({ apiKey: groqApiKey });
            tempFilePath = path.join(os.tmpdir(), `triage_${Date.now()}.webm`);
            fs.writeFileSync(tempFilePath, audioBuffer);

            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-large-v3',
                language: 'en'
            });

            if (!transcription || !transcription.text) {
                throw new Error("Empty Groq transcription result");
            }

            transcribedText = transcription.text.trim();
            console.log('[processVoiceTriage] Successfully transcribed via Groq Whisper.');
        }

        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        return res.status(200).json({ transcript: transcribedText });

    } catch (err) {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        console.error('[processVoiceTriage] Error:', err);
        return res.status(500).json({ error: 'Transcription failed. Please fall back to typing.' });
    }
}

module.exports = { performTriage, processVoiceTriage };
