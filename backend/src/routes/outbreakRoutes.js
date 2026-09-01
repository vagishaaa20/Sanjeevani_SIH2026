const express = require('express');
const { getActive, getDetails, resolve, broadcast } = require('../controllers/outbreakController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

// Public / Patient endpoints
router.get('/active', getActive);
router.get('/:id/details', getDetails);

// Admin endpoints
router.post('/:id/resolve', authenticate, requireRole('admin'), resolve);
router.post('/:id/broadcast', authenticate, requireRole('admin'), broadcast);

module.exports = router;
