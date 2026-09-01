const express = require('express');
const router = express.Router();
const controller = require('../controllers/clinicController');
const authenticate = require('../middleware/authMiddleware');

router.get('/', controller.listClinics);
router.get('/nearby', authenticate, controller.getNearbyClinics);
router.post('/register', controller.registerClinic);
router.get('/pending', controller.getPendingClinics);
router.patch('/verify/:id', controller.verifyClinic);

module.exports = router;
