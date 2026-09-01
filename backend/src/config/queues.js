// ── BullMQ queue instances used across the WhatsApp integration ────────────────
const { Queue } = require('bullmq');
const redisConnection = require('./redis');

/**
 * `whatsapp-inbound`  — jobs added by the webhook handler; consumed by whatsappWorker
 * `whatsapp-outbound` — jobs added by waCloudService / controllers; consumed by whatsappWorker
 *                       Retry config: exponential backoff, max 3 attempts.
 */
const inboundQueue = new Queue('whatsapp-inbound', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100, // keep last 100 completed jobs for debugging
        removeOnFail: 200,
    },
});

const outboundQueue = new Queue('whatsapp-outbound', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 200,
    },
});

/**
 * `medication-reminders` — repeatable daily cron jobs for medication reminders.
 * ⚠️ PRODUCTION NOTE: Repeatable jobs persist in Redis across restarts.
 *    Ensure Redis persistence (RDB or AOF) is enabled before relying on this in production.
 *    Without persistence, all scheduled repeatable jobs are lost on Redis restart.
 */
const medicationReminderQueue = new Queue('medication-reminders', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 100,
    },
});

module.exports = { inboundQueue, outboundQueue, medicationReminderQueue };
