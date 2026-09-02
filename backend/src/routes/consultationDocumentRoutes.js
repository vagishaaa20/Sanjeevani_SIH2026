const express = require('express');
const router = express.Router();
const consultationDocumentController = require('../controllers/consultationDocumentController');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

// Allows both patients to upload and doctors/patients to fetch
router.post('/:id/documents', consultationDocumentController.uploadDocument);
router.get('/:id/documents', consultationDocumentController.getDocuments);

module.exports = router;
