const express = require('express');
const router = express.Router();
const diagnosticController = require('../controllers/diagnosticController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticate);

// Create request (Doctor, Health Worker)
router.post('/', requireRole(['doctor', 'health_worker']), diagnosticController.createRequest);

// Get requests (All)
router.get('/', diagnosticController.getRequests);

// Update status (Clinic)
router.put('/:id/status', requireRole(['clinic_admin']), diagnosticController.updateStatus);

// Upload result (Clinic)
router.post('/:id/result', requireRole(['clinic_admin']), upload.single('document'), diagnosticController.uploadResult);

module.exports = router;
