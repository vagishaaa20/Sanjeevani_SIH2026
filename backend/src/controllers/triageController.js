const { runTriage } = require('../services/triageService');

async function performTriage(req, res) {
    try {
        const patientId = req.user.id;
        const { symptoms, duration, severity } = req.body;

        if (!symptoms) {
            return res.status(400).json({ error: 'Symptoms are required' });
        }

        const result = await runTriage({ symptoms, duration, severity, patientId });

        return res.json(result);
    } catch (err) {
        console.error('[triageController] Error:', err);
        return res.status(500).json({ error: err.message || 'Triage failed' });
    }
}

module.exports = { performTriage };
