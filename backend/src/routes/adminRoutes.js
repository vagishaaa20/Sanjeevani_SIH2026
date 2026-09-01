const express = require('express');
const controller = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

// All admin routes require authentication and the admin role.
router.use(authenticate);
router.use(requireRole('admin'));

// ── Verification queue ────────────────────────────────────────────────────────
router.get('/pending', controller.listPending);

// ── User management ───────────────────────────────────────────────────────────
router.get('/users', controller.listUsers);
router.get('/users/:userId', controller.getUserDetail);

// ── Verification actions ──────────────────────────────────────────────────────
router.patch('/verify/:userId', controller.verifyUser);

// ── Document review ───────────────────────────────────────────────────────────
router.patch('/documents/:documentId', controller.reviewDocument);
router.get('/documents/:documentId/file', controller.serveDocument);

module.exports = router;