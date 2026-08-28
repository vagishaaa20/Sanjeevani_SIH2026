const express = require('express');
const controller = require('../controllers/profileController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// All profile routes require a valid access token.
router.use(authenticate);

// ── Read own profile (role-aware) ─────────────────────────────────────────────
router.get('/me', controller.getMyProfile);

// ── Update profile (each route enforces the correct role internally) ──────────
router.patch('/patient', controller.updatePatientProfile);
router.patch('/doctor', controller.updateDoctorProfile);
router.patch('/reviewer', controller.updateReviewerProfile);

// ── Dev Auto-Verification (Local Development Helper) ────────────────────────
router.post('/doctor/dev-verify', controller.devVerifyDoctor);

module.exports = router;
