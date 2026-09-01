const express = require('express');
const { verifyWebhook, receiveWebhook, sendMessageController } = require('../controllers/whatsappController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const whatsappRateLimit = require('../middleware/whatsappRateLimit');

const router = express.Router();

// Public — Meta webhook handshake
router.get('/webhook', verifyWebhook);

// Public — Meta webhook inbound (no auth; Meta signs with a secret instead)
// The body must be raw JSON — express.json() must be registered before this.
router.post('/webhook', receiveWebhook);

// Authenticated patient — manual "connect me on WhatsApp" button
router.post('/send', authenticate, requireRole('patient'), whatsappRateLimit, sendMessageController);

module.exports = router;
