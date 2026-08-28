const express = require('express');
const controller = require('../controllers/authController');

const router = express.Router();

// ── Registration — role-specific ──────────────────────────────────────────────
router.post('/register/patient', controller.registerPatient);
router.post('/register/doctor', controller.registerDoctor);
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