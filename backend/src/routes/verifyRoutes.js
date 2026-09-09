'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyPrescription, extractPdfUUID } = require('../controllers/consultationController');

// Multer setup for in-memory file parsing
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Public route — no authentication required.
 * GET /api/verify/:consultationId
 * Recomputes hash from stored fields and checks on-chain anchoring.
 */
router.get('/:consultationId', verifyPrescription);

/**
 * Public route — accepts PDF upload, extracts UUID.
 * POST /api/verify/upload
 */
router.post('/upload', upload.single('pdf'), extractPdfUUID);

module.exports = router;
