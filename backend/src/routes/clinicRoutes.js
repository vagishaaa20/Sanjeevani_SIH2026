const express = require('express');
const router = express.Router();
const controller = require('../controllers/clinicController');
const authenticate = require('../middleware/authMiddleware');

const requireRole = require('../middleware/roleMiddleware');

router.get('/', controller.listClinics);
router.get('/nearby', authenticate, controller.getNearbyClinics);
router.post('/register', controller.registerClinic);
router.get('/pending', controller.getPendingClinics);
router.patch('/verify/:id', controller.verifyClinic);

router.get('/referrals', authenticate, requireRole('clinic_admin'), controller.getIncomingReferrals);
router.patch('/referrals/:id', authenticate, requireRole('clinic_admin'), controller.updateIncomingReferral);

module.exports = router;
