const { runTriage } = require('../services/triageService');
const { transcribeAudio } = require('../utils/aiClient');

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
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const audioBuffer = req.file.buffer;
        const mimeType = req.file.mimetype || 'audio/webm';

        const transcribedText = await transcribeAudio(audioBuffer, mimeType);

        return res.status(200).json({ transcript: transcribedText });
    } catch (err) {
        console.error('[processVoiceTriage] Error:', err);
        return res.status(500).json({ error: err.message || 'Transcription failed. Please fall back to typing.' });
    }
}

module.exports = { performTriage, processVoiceTriage };
