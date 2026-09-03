const express = require('express');
const router = express.Router();
const controller = require('../controllers/medicineInventoryController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/search', authenticate, requireRole('patient'), controller.searchMedicineAvailability);

module.exports = router;
