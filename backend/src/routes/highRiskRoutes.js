const express = require('express');
const router = express.Router();
const highRiskController = require('../controllers/highRiskController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/patients', 
    requireRole(['health_worker', 'doctor', 'admin']), 
    highRiskController.listPatients
);

router.post('/patients/:patientId/manual', 
    requireRole(['health_worker']), 
    highRiskController.createManualHighRisk
);

router.get('/patients/:patientId', 
    requireRole(['health_worker', 'doctor', 'admin']), 
    highRiskController.patientDetails
);

router.patch('/patients/:patientId/escalate', 
    requireRole(['health_worker']), 
    highRiskController.escalatePatient
);

router.patch('/patients/:patientId/status', 
    requireRole(['health_worker', 'doctor', 'admin']), 
    highRiskController.updateStatus
);

module.exports = router;
