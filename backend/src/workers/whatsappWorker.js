/**
 * WhatsApp BullMQ Worker
 *
 * Runs as a SEPARATE PROCESS from the API server:
 *   node src/workers/whatsappWorker.js
 *
 * In production, run this as a separate container/PM2 process:
 *   pm2 start src/workers/whatsappWorker.js --name wa-worker
 *
 * Consumes two queues:
 *   - whatsapp-inbound  → runs the bot state machine
 *   - whatsapp-outbound → sends the message via the Graph API, marks failed after retries exhausted
 */

require('../config/env'); // load .env before any other imports
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const { handleInbound } = require('../services/whatsappBotService');
const { sendWhatsAppMessage } = require('../services/waCloudService');
const WhatsappLog = require('../models/whatsappLogModel');

function log(queue, jobId, msg, data = {}) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), queue, jobId, msg, ...data }));
}

// ── Inbound worker ────────────────────────────────────────────────────────────

const inboundWorker = new Worker(
    'whatsapp-inbound',
    async (job) => {
        const { phone, messageType, messageBody, location } = job.data;
        log('whatsapp-inbound', job.id, 'processing', { messageType });
        await handleInbound(phone, messageType, messageBody, location);
        log('whatsapp-inbound', job.id, 'done');
    },
    {
        connection: redisConnection,
        concurrency: 5, // process up to 5 inbound messages in parallel
    }
);

inboundWorker.on('failed', (job, err) => {
    log('whatsapp-inbound', job?.id, 'failed', { error: err.message, attempt: job?.attemptsMade });
});

// ── Outbound worker ───────────────────────────────────────────────────────────

const outboundWorker = new Worker(
    'whatsapp-outbound',
    async (job) => {
        const { to, payload } = job.data;
        log('whatsapp-outbound', job.id, 'sending', { to: to?.slice(0, 4) + '****' });
        const waMessageId = await sendWhatsAppMessage(to, payload);
        log('whatsapp-outbound', job.id, 'sent', { waMessageId });
    },
    {
        connection: redisConnection,
        concurrency: 10,
    }
);

outboundWorker.on('failed', async (job, err) => {
    log('whatsapp-outbound', job?.id, 'failed', { error: err.message, attempt: job?.attemptsMade });

    // After all retries are exhausted (attemptsMade === attempts from job options),
    // mark the corresponding whatsapp_logs row as 'failed'.
    if (job && job.attemptsMade >= (job.opts?.attempts || 3)) {
        try {
            const { to } = job.data || {};
            if (to) {
                await WhatsappLog.update(
                    { status: 'failed' },
                    { where: { phone: to, status: 'sent' } }
                );
            }
        } catch (logErr) {
            console.error('[outboundWorker] Could not mark log as failed:', logErr.message);
        }
    }
});

console.log('✅ WhatsApp worker started — listening on whatsapp-inbound and whatsapp-outbound');

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown() {
    console.log('[worker] shutting down…');
    await inboundWorker.close();
    await outboundWorker.close();
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
