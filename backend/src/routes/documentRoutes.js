const express = require('express');
const controller = require('../controllers/documentController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Publicly streamable only when accompanied by a cryptographically signed HMAC/JWT token
router.get('/:documentId/signed-stream', controller.serveSignedStream);

// Protected routes
router.use(authenticate);
router.use(requireRole([ROLES.DOCTOR, ROLES.HEALTH_WORKER, ROLES.CLINIC_ADMIN, ROLES.ADMIN]));

router.post('/', upload.single('document'), controller.uploadDocument);
router.get('/me', controller.listMyDocuments);
router.get('/:documentId/signed-url', controller.getMyDocumentSignedUrl);
router.delete('/:documentId', controller.deleteMyDocument);

module.exports = router;