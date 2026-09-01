/**
 * Medication Reminder Worker
 *
 * Consumes the 'medication-reminders' BullMQ queue and sends WhatsApp
 * notifications to patients using the existing sendWhatsAppMessage function.
 *
 * ⚠️ PRODUCTION NOTE: BullMQ repeatable jobs persist in Redis across restarts.
 *    Ensure Redis persistence (RDB or AOF) is enabled before relying on this
 *    in production. Without persistence, all scheduled repeatable jobs are lost
 *    on Redis restart and must be re-scheduled via the activate endpoint.
 *
 * Run alongside whatsappWorker.js:
 *   node src/workers/reminderWorker.js
 */
require('../config/env');
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const { sendWhatsAppMessage } = require('../services/waCloudService');
const sequelize = require('../config/db');

const reminderWorker = new Worker(
    'medication-reminders',
    async (job) => {
        const { reminderId, patientId, medicineName, dosage } = job.data;

        // Fetch patient phone from DB
        const [rows] = await sequelize.query(
            `SELECT u.phone, p."fullName"
             FROM "Users" u
             JOIN "PatientProfiles" p ON p."userId" = u.id
             WHERE u.id = :patientId`,
            { replacements: { patientId }, type: sequelize.QueryTypes.SELECT }
        );

        if (!rows?.phone) {
            console.warn(`[reminderWorker] No phone for patient ${patientId} — skipping job ${job.id}`);
            return;
        }

        const phone = rows.phone.replace('+', '');
        const name = rows.fullName || 'Patient';
        const dosageText = dosage ? ` (${dosage})` : '';

        await sendWhatsAppMessage(phone, {
            type: 'text',
            text: {
                body: `💊 *Medication Reminder*\n\nHi ${name}, time to take your *${medicineName}*${dosageText}.\n\nReply *MENU* for your Sanjeevani health dashboard.`,
            },
        });

        console.log(`[reminderWorker] ✅ Reminder sent for ${medicineName} to ${phone}`);
    },
    { connection: redisConnection, concurrency: 3 }
);

reminderWorker.on('completed', (job) => {
    console.log(`[reminderWorker] Job ${job.id} completed`);
});

reminderWorker.on('failed', (job, err) => {
    console.error(`[reminderWorker] Job ${job?.id} failed:`, err.message);
});

console.log('✅ Medication reminder worker started — listening on "medication-reminders" queue');
