const TriageRequest = require('../models/TriageRequest');
const { runTriageAI } = require('../../services/triageAI');

// POST /api/triage/submit  (patient)
async function submitTriage(req, res) {
  try {
    const { symptoms, duration, medicalHistory } = req.body;
    if (!symptoms || !symptoms.trim()) {
      return res.status(400).json({ message: 'Symptoms are required.' });
    }

    const request = await TriageRequest.create({
      patientId: req.user.id, // assumes auth middleware attaches req.user
      symptoms: symptoms.trim(),
      duration: duration || null,
      medicalHistory: medicalHistory || null,
      status: 'ai_analysis',
    });

    const aiResult = await runTriageAI({ symptoms, duration, medicalHistory });

    await request.update({
      status: 'doctor_review',
      aiUrgency: aiResult.urgency,
      aiGuidance: aiResult.guidance,
      aiConfidence: aiResult.confidence,
    });

    return res.status(201).json({ requestId: request.id });
  } catch (err) {
    console.error('submitTriage error:', err);
    return res.status(500).json({ message: 'Failed to submit triage request.' });
  }
}

// GET /api/triage/:id/status  (patient — polled)
async function getTriageStatus(req, res) {
  try {
    const request = await TriageRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Triage request not found.' });

    if (request.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this request.' });
    }

    const response = { status: request.status };

    if (request.status === 'reviewed') {
      response.finalResult = {
        urgency: request.finalUrgency,
        guidance: request.finalGuidance,
        reviewedBy: request.reviewedBy, // consider joining User to return doctor name instead of id
      };
    }

    return res.json(response);
  } catch (err) {
    console.error('getTriageStatus error:', err);
    return res.status(500).json({ message: 'Failed to fetch triage status.' });
  }
}

// GET /api/triage/pending  (doctor dashboard queue)
async function listPendingReviews(req, res) {
  try {
    const pending = await TriageRequest.findAll({
      where: { status: 'doctor_review' },
      order: [['createdAt', 'ASC']],
    });
    return res.json(pending);
  } catch (err) {
    console.error('listPendingReviews error:', err);
    return res.status(500).json({ message: 'Failed to fetch pending reviews.' });
  }
}

// POST /api/triage/:id/review  (doctor approves or overrides AI result)
async function reviewTriage(req, res) {
  try {
    const { urgency, guidance } = req.body; // doctor can keep AI's values or override
    const request = await TriageRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Triage request not found.' });

    if (request.status !== 'doctor_review') {
      return res.status(409).json({ message: 'This request is not awaiting review.' });
    }

    await request.update({
      status: 'reviewed',
      finalUrgency: urgency || request.aiUrgency,
      finalGuidance: guidance || request.aiGuidance,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });

    return res.json({ message: 'Triage reviewed.', requestId: request.id });
  } catch (err) {
    console.error('reviewTriage error:', err);
    return res.status(500).json({ message: 'Failed to submit review.' });
  }
}

module.exports = { submitTriage, getTriageStatus, listPendingReviews, reviewTriage };