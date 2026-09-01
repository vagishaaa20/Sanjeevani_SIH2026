const { medicationReminderQueue } = require('../config/queues');

/**
 * Schedules one repeatable BullMQ job per reminder_time for a medication reminder.
 * Uses deterministic jobId `reminder-${id}-${time}` so we can reliably remove jobs later.
 *
 * Daily cron pattern: `MM HH * * *` (local server time — ensure server TZ = IST in production).
 *
 * @param {object} reminder — MedicationReminder Sequelize instance or plain object
 * @returns {Promise<string[]>} — array of BullMQ job IDs
 */
async function scheduleReminder(reminder) {
    const jobIds = [];

    for (const time of reminder.reminderTimes || reminder.reminder_times || []) {
        const [hour, minute] = String(time).split(':');
        if (!hour || !minute) continue;

        const cronPattern = `${minute} ${hour} * * *`;
        const jobId = `reminder-${reminder.id}-${time}`;

        const job = await medicationReminderQueue.add(
            'send-reminder',
            {
                reminderId: reminder.id,
                patientId: reminder.patientId || reminder.patient_id,
                medicineName: reminder.medicineName || reminder.medicine_name,
                dosage: reminder.dosage,
            },
            {
                repeat: {
                    pattern: cronPattern,
                    ...(reminder.endDate || reminder.end_date
                        ? { endDate: new Date(reminder.endDate || reminder.end_date) }
                        : {}),
                },
                jobId,
            }
        );

        jobIds.push(job.id || jobId);
    }

    return jobIds;
}

/**
 * Removes all repeatable BullMQ jobs associated with a medication reminder.
 * BullMQ repeatable jobs must be removed by key (not normal job id).
 *
 * @param {object} reminder — MedicationReminder instance or plain object with { id }
 * @returns {Promise<void>}
 */
async function unscheduleReminder(reminder) {
    const repeatableJobs = await medicationReminderQueue.getRepeatableJobs();

    for (const job of repeatableJobs) {
        if (job.id?.startsWith(`reminder-${reminder.id}-`)) {
            await medicationReminderQueue.removeRepeatableByKey(job.key);
        }
    }
}

module.exports = { scheduleReminder, unscheduleReminder };
