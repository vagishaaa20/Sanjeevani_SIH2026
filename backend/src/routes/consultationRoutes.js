const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const auth = [authenticate, requireRole('patient')];

// Patient fetches their own consultation history (paginated)
router.get('/me', ...auth, consultationController.getMyConsultations);

// Symptom timeline — chronological list of symptoms + outcomes
router.get('/timeline', ...auth, consultationController.getTimeline);

// Patient rejoins an in-progress call
router.get('/:id/rejoin', ...auth, consultationController.rejoinCall);

// Generate (or return cached) AI plain-language summary for a completed consultation
router.post('/:id/summary', ...auth, consultationController.generateAiSummary);

module.exports = router;
