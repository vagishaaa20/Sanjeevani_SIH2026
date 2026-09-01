const express = require('express');
const controller = require('../controllers/documentController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticate);
router.use(requireRole([ROLES.DOCTOR, ROLES.CLINIC_ADMIN]));

router.post('/', upload.single('document'), controller.uploadDocument);
router.get('/me', controller.listMyDocuments);
router.delete('/:documentId', controller.deleteMyDocument);

module.exports = router;