const express = require('express');
const controller = require('../controllers/authController');

const router = express.Router();

const upload = require('../middleware/uploadMiddleware');

// ── Registration — role-specific ──────────────────────────────────────────────
router.post('/register/patient', controller.registerPatient);
router.post(
    '/register/doctor',
    upload.fields([
        { name: 'medicalRegistrationCertificate', maxCount: 1 },
        { name: 'mbbsOrPrimaryQualification', maxCount: 1 },
    ]),
    controller.registerDoctor
);
router.post('/register/clinic', controller.registerClinic);
router.post('/register/hitl', controller.registerHitl);

// ── Login (email/password — doctor, hitl_reviewer, admin) ────────────────────
router.post('/login', controller.login);

// ── Patient OTP login flow ────────────────────────────────────────────────────
router.post('/otp/send', controller.sendOtp);
router.post('/otp/verify', controller.verifyOtp);

// ── Token lifecycle ───────────────────────────────────────────────────────────
router.post('/refresh', controller.refreshToken);
router.post('/logout', controller.logout);

module.exports = router;