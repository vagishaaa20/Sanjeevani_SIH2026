const express = require('express');
const controller = require('../controllers/requestController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

// All request routes require authentication
router.use(authenticate);

// Patient routes
router.post('/upload-attachment', requireRole(ROLES.PATIENT), controller.uploadAttachmentMulter.single('file'), controller.uploadAttachment);
router.post('/ai-triage-preview', requireRole(ROLES.PATIENT), controller.previewTriage);
router.post('/', requireRole(ROLES.PATIENT), controller.createRequest);
router.get('/my', requireRole(ROLES.PATIENT), controller.listMyRequests);
router.post('/:id/hitl-timeout', requireRole(ROLES.PATIENT), controller.fallbackHitlTimeout);

// HITL Reviewer & Admin routes
router.get('/hitl/queue', controller.listHitlQueue);
router.post('/hitl/:id/approve', controller.approveHitlTriage);
router.post('/hitl/:id/override', controller.overrideHitlTriage);

// Doctor routes
router.get('/nearby', requireRole(ROLES.DOCTOR), controller.listNearbyRequests);
router.get('/accepted', requireRole(ROLES.DOCTOR), controller.listAcceptedRequests);

// Parameterized routes (defined last)
router.get('/:id', controller.getRequestDetail);
router.patch('/:id/accept', requireRole(ROLES.DOCTOR), controller.acceptRequest);
router.patch('/:id/prescription', requireRole(ROLES.DOCTOR), controller.issuePrescription);

module.exports = router;
