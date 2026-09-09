const express = require('express');
const controller = require('../controllers/healthWorkerController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();
const workerAuth = [authenticate, requireRole('health_worker')];

router.get('/dashboard', ...workerAuth, controller.dashboard);
router.get('/patients', ...workerAuth, controller.listPatients);
router.get('/patients/:patientId', ...workerAuth, controller.patientDetails);
router.get('/patients/:patientId/followups', ...workerAuth, controller.patientFollowups);
router.get('/followups', ...workerAuth, controller.listFollowups);
router.post('/followups', ...workerAuth, controller.createFollowup);
router.get('/referrals', ...workerAuth, controller.listReferrals);
router.patch('/referrals/:referralId', ...workerAuth, controller.updateReferral);
router.post('/messages', ...workerAuth, controller.sendPatientMessage);
router.post('/referrals', authenticate, requireRole(['doctor', 'admin', 'clinic_admin', 'health_worker']), controller.createReferral);
router.get('/directory', authenticate, requireRole(['admin', 'clinic_admin']), controller.listDirectory);
router.patch('/profile', ...workerAuth, controller.updateWorkerProfile);

module.exports = router;