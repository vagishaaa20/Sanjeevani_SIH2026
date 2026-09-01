/**
 * WhatsApp Cloud API controller
 *
 * Routes:
 *   GET  /api/whatsapp/webhook  — Meta webhook verification handshake (public)
 *   POST /api/whatsapp/webhook  — Inbound message handler (public, no auth)
 *   POST /api/whatsapp/send     — Manual send (authenticated patient + rate-limited)
 */

const WhatsappLog = require('../models/whatsappLogModel');
const { enqueueFreeText } = require('../services/waCloudService');
const { inboundQueue } = require('../config/queues');

// ── Webhook verification ──────────────────────────────────────────────────────

/**
 * GET /api/whatsapp/webhook
 *
 * Meta calls this to verify the webhook URL during setup.
 * Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
function verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
        console.log('[whatsappController] Webhook verified by Meta');
        return res.status(200).send(challenge);
    }

    console.warn('[whatsappController] Webhook verification failed — token mismatch');
    return res.status(403).json({ error: 'Forbidden: verify_token mismatch' });
}

// ── Inbound webhook handler ───────────────────────────────────────────────────

/**
 * POST /api/whatsapp/webhook
 *
 * Meta retries this if it gets a non-200 or times out — so we:
 *   1. Parse and validate the payload shape
 *   2. Deduplicate on wa_message_id (unique constraint in whatsapp_logs)
 *   3. Log the raw inbound to whatsapp_logs SYNCHRONOUSLY (for idempotency)
 *   4. Enqueue to whatsapp-inbound for async processing
 *   5. Return 200 immediately
 *
 * Payload structure (Meta Cloud API):
 *   entry[0].changes[0].value.messages[0]          ← message object
 *   entry[0].changes[0].value.contacts[0].wa_id    ← sender phone (no leading +)
 */
async function receiveWebhook(req, res) {
    // Always acknowledge immediately — Meta will retry otherwise
    res.status(200).json({ status: 'ok' });

    try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') return;

        const value = body?.entry?.[0]?.changes?.[0]?.value;
        if (!value?.messages?.length) return; // status updates, not messages

        const message = value.messages[0];
        const phone = value.contacts?.[0]?.wa_id || message.from; // E.164 without +
        const waMessageId = message.id;

        // ── Idempotency check: skip if already processed ──────────────────────
        // WhatsappLog.waMessageId has a UNIQUE constraint — findOrCreate pattern
        const [, created] = await WhatsappLog.findOrCreate({
            where: { waMessageId },
            defaults: {
                phone,
                direction: 'inbound',
                messageType: message.type === 'location' ? 'location' : 'text',
                message: message.type === 'text' ? message.text?.body : '[location]',
                waMessageId,
                status: 'received',
            },
        });

        if (!created) {
            console.log(`[whatsappController] Duplicate inbound ignored: ${waMessageId}`);
            return;
        }

        // ── Parse message content ─────────────────────────────────────────────
        let messageBody = '';
        let location = null;

        if (message.type === 'text') {
            messageBody = message.text?.body || '';
        } else if (message.type === 'location') {
            location = {
                latitude: message.location?.latitude,
                longitude: message.location?.longitude,
            };
        }

        // ── Enqueue for async processing ──────────────────────────────────────
        await inboundQueue.add('handle-inbound', {
            phone,
            messageType: message.type,
            messageBody,
            location,
        });

        console.log(`[whatsappController] Inbound enqueued: ${waMessageId} from ${phone.slice(0, 4)}****`);
    } catch (err) {
        // Do NOT re-throw — 200 was already sent; log and move on
        console.error('[whatsappController] receiveWebhook processing error:', err.message);
    }
}

// ── Manual send (patient-initiated via dashboard button) ──────────────────────

/**
 * POST /api/whatsapp/send
 * Body: { message: string } (optional; defaults to a welcome nudge)
 *
 * ⚠️ FREE-FORM: Only works within 24 h of the patient's last inbound message.
 *    Free through Sep 30 2026 in India; chargeable from Oct 1 2026.
 */
async function sendMessageController(req, res) {
    const { message } = req.body;
    const phone = req.user?.phone?.replace('+', '');

    if (!phone) {
        return res.status(400).json({ error: 'No phone number on your account. Please update your profile.' });
    }

    const text = message?.trim() ||
        `Hi! 👋 You're now connected to *Sanjeevani* on WhatsApp.\n\nReply *MENU* anytime to:\n• Find nearby doctors\n• Book appointments\n• Get AI symptom check`;

    try {
        await enqueueFreeText(phone, text);
        return res.json({ success: true, message: 'WhatsApp message queued for delivery.' });
    } catch (err) {
        console.error('[whatsappController] sendMessage error:', err.message);
        return res.status(500).json({ error: 'Failed to send WhatsApp message. Please try again.' });
    }
}

module.exports = { verifyWebhook, receiveWebhook, sendMessageController };
