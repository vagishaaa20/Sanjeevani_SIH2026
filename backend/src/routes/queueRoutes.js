const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Live queue status (public-ish)
router.get('/live', (req, res) => res.json({ status: 'live' }));

// Patient submits a consultation request → enters doctor's queue
router.post('/request', authenticate, requireRole('patient'), queueController.requestConsultation);

// Patient views their own queue entries
router.get('/my', authenticate, requireRole('patient'), queueController.myQueue);

// Patient selects one doctor from the accepted doctors list for a pool broadcast
router.post('/:id/select-doctor', authenticate, requireRole('patient'), queueController.selectDoctor);

// Patient explicitly cancels their own WAITING queue request
router.post('/:id/cancel', authenticate, requireRole('patient'), queueController.cancelQueue);

module.exports = router;
