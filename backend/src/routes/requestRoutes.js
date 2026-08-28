const express = require('express');
const controller = require('../controllers/requestController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

// All request routes require authentication
router.use(authenticate);

// Patient routes
router.post('/', requireRole(ROLES.PATIENT), controller.createRequest);
router.get('/my', requireRole(ROLES.PATIENT), controller.listMyRequests);

// Doctor routes
router.get('/nearby', requireRole(ROLES.DOCTOR), controller.listNearbyRequests);
router.get('/accepted', requireRole(ROLES.DOCTOR), controller.listAcceptedRequests);

// Parameterized routes (defined last)
router.get('/:id', controller.getRequestDetail);
router.patch('/:id/accept', requireRole(ROLES.DOCTOR), controller.acceptRequest);
router.patch('/:id/prescription', requireRole(ROLES.DOCTOR), controller.issuePrescription);

module.exports = router;
