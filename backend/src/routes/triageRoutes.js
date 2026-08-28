const express = require('express');
const router = express.Router();

const {
  submitTriage,
  getTriageStatus,
  listPendingReviews,
  reviewTriage,
} = require('../controllers/triageController');

const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.post('/submit', authenticate, submitTriage);
router.get('/:id/status', authenticate, getTriageStatus);

router.get('/pending', authenticate, requireRole('doctor'), listPendingReviews);
router.post('/:id/review', authenticate, requireRole('doctor'), reviewTriage);

module.exports = router;