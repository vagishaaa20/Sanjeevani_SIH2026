/**
 * Meta WhatsApp Business Cloud API — outbound messaging service.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COST NOTES (India pricing as of Sep 1 2026):
 *
 *   FREE-FORM sends  (type: 'text')
 *     ⚠️  FREE through Sep 30 2026 for "utility conversations" in India.
 *     ⚠️  CHARGEABLE from Oct 1 2026. Only works within 24 h of the patient's
 *         last inbound message (the "service window").
 *
 *   TEMPLATE sends   (type: 'template')
 *     ⚠️  ALWAYS CHARGEABLE. Works outside the 24-h window.
 *     ⚠️  Requires pre-approval in Meta Business Manager.
 *         Templates currently referenced:
 *           - 'sanjeevani_welcome'              (utility category)
 *           - 'sanjeevani_booking_confirmation' (utility category)
 *         Create and submit these in Business Manager before relying on them.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Env vars required:
 *   WA_CLOUD_API_TOKEN   — permanent access token from Meta Business Manager
 *   WA_PHONE_NUMBER_ID   — numeric ID of the registered WhatsApp phone number
 *   WA_API_VERSION       — Graph API version, e.g. 'v20.0'
 */

const axios = require('axios');
const WhatsappLog = require('../models/whatsappLogModel');
const { outboundQueue } = require('../config/queues');

const API_VERSION = process.env.WA_API_VERSION || 'v20.0';
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const TOKEN = process.env.WA_CLOUD_API_TOKEN;

/**
 * Builds the Graph API endpoint URL.
 */
function messagesUrl() {
    return `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
}

/**
 * Low-level: POST to the Meta Graph API and log the result.
 * Called directly by the outbound worker — not by application code.
 *
 * @param {string} to       E.164 phone number, e.g. "919876543210" (no leading +)
 * @param {object} payload  Ready-to-send Graph API message payload
 * @returns {Promise<string>} The wa_message_id returned by Meta
 */
async function sendWhatsAppMessage(to, payload) {
    if (!TOKEN || !PHONE_NUMBER_ID) {
        throw new Error('WA_CLOUD_API_TOKEN or WA_PHONE_NUMBER_ID env vars are not set');
    }

    const body = { messaging_product: 'whatsapp', ...payload };

    const response = await axios.post(messagesUrl(), body, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
        timeout: 10000,
    });

    const waMessageId = response.data?.messages?.[0]?.id || null;

    // Log to whatsapp_logs (best-effort; don't throw if logging fails)
    try {
        await WhatsappLog.create({
            phone: to,
            direction: 'outbound',
            messageType: payload.type === 'template' ? 'template' : 'text',
            message: payload.type === 'template' ? payload.template?.name : payload.text?.body,
            waMessageId,
            status: 'sent',
        });
    } catch (logErr) {
        console.error('[waCloudService] Failed to log outbound message:', logErr.message);
    }

    return waMessageId;
}

/**
 * Enqueues an outbound FREE-FORM text message.
 * ⚠️  FREE-FORM: Only works within the 24-hour service window.
 *     Free through Sep 30 2026; chargeable from Oct 1 2026 (India).
 *
 * @param {string} to    E.164 phone number
 * @param {string} body  Plain text content
 */
async function enqueueFreeText(to, body) {
    await outboundQueue.add('send-text', {
        to,
        payload: {
            to,
            type: 'text',
            text: { preview_url: false, body },
        },
    });
}

/**
 * Enqueues an outbound TEMPLATE message.
 * ⚠️  TEMPLATE: Always chargeable. Requires Meta approval before use.
 *     Works outside the 24-hour service window.
 *
 * @param {string} to              E.164 phone number
 * @param {string} templateName    Approved template name, e.g. 'sanjeevani_welcome'
 * @param {string} [languageCode]  BCP-47 language code, defaults to 'en'
 * @param {Array}  [components]    Template variable components (header/body/buttons)
 */
async function enqueueTemplate(to, templateName, languageCode = 'en', components = []) {
    await outboundQueue.add('send-template', {
        to,
        payload: {
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                ...(components.length ? { components } : {}),
            },
        },
    });
}

module.exports = { sendWhatsAppMessage, enqueueFreeText, enqueueTemplate };
