const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { upload, uploadDocument, getMyDocuments, deleteDocument } = require('../controllers/documentController');

const router = express.Router();

// ── Authenticated routes (doctor and hitl_reviewer only) ─────────────────────

// Upload a single document file
// Field name must be "file" in the multipart form
router.post(
  '/upload',
  authenticate,
  (req, res, next) => upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  }),
  uploadDocument
);

// List own documents (metadata only)
router.get('/my', authenticate, getMyDocuments);

// Delete a pending document
router.delete('/:id', authenticate, deleteDocument);

module.exports = router;
