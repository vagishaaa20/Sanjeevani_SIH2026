const express = require('express');
const { listPublicDoctors, getPublicDoctor, getNearbyDoctors, updateOwnProfile } = require('../controllers/doctorController');
const { postReview } = require('../controllers/reviewController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

// Public — no authentication required
router.get('/', listPublicDoctors);
router.get('/nearby', authenticate, getNearbyDoctors);
router.patch('/profile', authenticate, updateOwnProfile);
router.get('/:userId', getPublicDoctor);

// Patient submits a star rating + comment for a completed consultation
router.post('/:doctorId/reviews', authenticate, requireRole('patient'), postReview);

module.exports = router;
