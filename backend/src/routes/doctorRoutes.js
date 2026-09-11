const express = require('express');
const { listPublicDoctors, getPublicDoctor, getNearbyDoctors, updateOwnProfile, getRecentPatients, getDoctorStats } = require('../controllers/doctorController');
const { postReview, getDoctorReviews, getLeaderboard } = require('../controllers/reviewController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

// Public — no authentication required
router.get('/', listPublicDoctors);
router.get('/leaderboard', getLeaderboard);
router.get('/nearby', authenticate, getNearbyDoctors);
router.patch('/profile', authenticate, updateOwnProfile);

// Authenticated Doctor Routes
router.get('/stats/overview', authenticate, requireRole('doctor'), getDoctorStats);
router.get('/patients/recent', authenticate, requireRole('doctor'), getRecentPatients);
router.get('/referrals', authenticate, requireRole('doctor'), require('../controllers/doctorController').getIncomingReferrals);
router.patch('/referrals/:id', authenticate, requireRole('doctor'), require('../controllers/doctorController').updateIncomingReferral);

// Reviews
router.get('/:doctorId/reviews', getDoctorReviews);
router.post('/:doctorId/reviews', authenticate, requireRole('patient'), postReview);

router.get('/:userId', getPublicDoctor);

module.exports = router;

