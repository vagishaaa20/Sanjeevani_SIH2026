const express = require('express');
const router = express.Router();
const doctorQueueController = require('../controllers/doctorQueueController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authenticate, requireRole('doctor'));

router.get('/', doctorQueueController.getQueue);
router.post('/:id/accept', doctorQueueController.acceptRequest);
router.post('/:id/skip', doctorQueueController.skipRequest);
router.post('/:id/complete', doctorQueueController.completeRequest);

module.exports = router;
