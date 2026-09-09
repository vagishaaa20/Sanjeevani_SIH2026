const express = require('express');
const multer = require('multer');
const { performTriage, processVoiceTriage } = require('../controllers/triageController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authenticate, requireRole('patient'), performTriage);
router.post('/voice', authenticate, requireRole('patient'), upload.single('audio_file'), processVoiceTriage);

module.exports = router;
