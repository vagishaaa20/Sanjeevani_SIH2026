const express = require('express');
const { listPublicDoctors, getPublicDoctor } = require('../controllers/doctorController');

const router = express.Router();

// Public — no authentication required
router.get('/', listPublicDoctors);
router.get('/:userId', getPublicDoctor);

module.exports = router;
