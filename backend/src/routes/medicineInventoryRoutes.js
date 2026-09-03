const express = require('express');
const router = express.Router();
const controller = require('../controllers/medicineInventoryController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const clinicAuth = [authenticate, requireRole('clinic_admin')];

router.get('/', ...clinicAuth, controller.listClinicInventory);
router.post('/', ...clinicAuth, controller.createInventoryItem);
router.patch('/:medicineId', ...clinicAuth, controller.updateInventoryItem);
router.delete('/:medicineId', ...clinicAuth, controller.deleteInventoryItem);

module.exports = router;
