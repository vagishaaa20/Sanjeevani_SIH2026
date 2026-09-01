const cron = require('node-cron');
const { runDetectionCycle } = require('../services/outbreakDetectionService');
const { notifyOutbreak } = require('../services/outbreakNotifierService');
const config = require('../config/outbreakThresholds');

/**
 * Initializes the background cron job for outbreak detection.
 * @param {object} io - Socket.io server instance
 */
function startOutbreakCronWorker(io) {
    const schedule = config.cronSchedule || '*/5 * * * *';

    cron.schedule(schedule, async () => {
        try {
            console.log(`[outbreakCron] Running detection cycle...`);
            const updatedAlerts = await runDetectionCycle();

            if (updatedAlerts.length > 0) {
                console.log(`[outbreakCron] Found ${updatedAlerts.length} updated alerts. Dispatching notifications...`);
                for (const alert of updatedAlerts) {
                    await notifyOutbreak(alert, io);
                }
            }
        } catch (err) {
            console.error('[outbreakCron] Cycle failed:', err);
        }
    });

    console.log(`✅ Outbreak detection cron worker started (Schedule: ${schedule})`);
}

module.exports = { startOutbreakCronWorker };
