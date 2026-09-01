const express = require('express');
const router = express.Router();
const subsidyController = require('../controllers/subsidyController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Patient fetches their own subsidy status + savings
router.get('/me', authenticate, requireRole('patient'), subsidyController.getMySubsidy);

// Patient applies for the subsidy scheme
router.post('/apply', authenticate, requireRole('patient'), subsidyController.applySubsidy);

module.exports = router;
