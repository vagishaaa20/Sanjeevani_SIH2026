const express = require('express');
const { listPublicDoctors, getPublicDoctor, getNearbyDoctors, updateOwnProfile, getRecentPatients } = require('../controllers/doctorController');
const { postReview } = require('../controllers/reviewController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

// Public — no authentication required
router.get('/', listPublicDoctors);
router.get('/nearby', authenticate, getNearbyDoctors);
router.patch('/profile', authenticate, updateOwnProfile);

// Authenticated Doctor Routes
router.get('/patients/recent', authenticate, requireRole('doctor'), getRecentPatients);
router.get('/referrals', authenticate, requireRole('doctor'), require('../controllers/doctorController').getIncomingReferrals);
router.patch('/referrals/:id', authenticate, requireRole('doctor'), require('../controllers/doctorController').updateIncomingReferral);

router.get('/:userId', getPublicDoctor);

// Patient submits a star rating + comment for a completed consultation
router.post('/:doctorId/reviews', authenticate, requireRole('patient'), postReview);

module.exports = router;
