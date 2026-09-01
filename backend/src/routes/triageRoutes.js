const express = require('express');
const { performTriage } = require('../controllers/triageController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authenticate, requireRole('patient'), performTriage);

module.exports = router;
