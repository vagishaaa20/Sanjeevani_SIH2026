const { Op } = require('sequelize');
const { MedicationReminder, MedicationLog, Consultation } = require('../models');
const { extractMedications } = require('../services/medicationExtractionService');
const { scheduleReminder, unscheduleReminder } = require('../services/reminderSchedulerService');

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayDateStr() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function currentTimeStr() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function doseStatus(time, takenTimes) {
    if (takenTimes.includes(time)) return 'taken';
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    const doseDate = new Date();
    doseDate.setHours(h, m, 0, 0);
    return now > doseDate ? 'missed' : 'upcoming';
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/medication-reminders/extract
 * Body: { consultationId, prescriptionText? }
 * Runs Gemini extraction on the prescription text (from body or consultation record).
 * Creates MedicationReminder rows in isActive=false state for patient review.
 */
async function extractAndCreate(req, res) {
    const patientId = req.user.id;
    const { consultationId, prescriptionText: bodyText } = req.body;

    if (!consultationId) {
        return res.status(400).json({ error: 'consultationId is required' });
    }

    try {
        // Verify ownership
        const consultation = await Consultation.findOne({
            where: { id: consultationId, patientId },
        });
        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        const textToExtract = bodyText || consultation.prescriptionText || consultation.notes;
        if (!textToExtract?.trim()) {
            return res.json({ reminders: [], reason: 'no_prescription_text' });
        }

        const extracted = await extractMedications(textToExtract);
        if (extracted.length === 0) {
            return res.json({ reminders: [], reason: 'no_medications_found' });
        }

        // Default start=today, no end date; patient can edit before activation
        const today = todayDateStr();
        const created = await Promise.all(
            extracted.map((med) =>
                MedicationReminder.create({
                    patientId,
                    consultationId,
                    medicineName: med.name,
                    dosage: med.dosage,
                    frequency: med.frequency,
                    startDate: today,
                    reminderTimes: ['09:00'],
                    isActive: false,
                    bullJobIds: [],
                })
            )
        );

        return res.status(201).json({ reminders: created });
    } catch (err) {
        console.error('[extractAndCreate] error:', err);
        return res.status(500).json({ error: 'Failed to extract medications' });
    }
}

/**
 * GET /api/medication-reminders/me
 * Returns all medication reminders for the logged-in patient.
 */
async function listReminders(req, res) {
    const patientId = req.user.id;
    try {
        const reminders = await MedicationReminder.findAll({
            where: { patientId },
            order: [['created_at', 'DESC']],
        });
        return res.json({ reminders });
    } catch (err) {
        console.error('[listReminders] error:', err);
        return res.status(500).json({ error: 'Failed to fetch reminders' });
    }
}

/**
 * PATCH /api/medication-reminders/:id
 * Body: { dosage?, frequency?, reminderTimes?, startDate?, endDate? }
 * Patient edits an unactivated reminder before confirming.
 */
async function updateReminder(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;
    const { dosage, frequency, reminderTimes, startDate, endDate } = req.body;

    try {
        const reminder = await MedicationReminder.findOne({ where: { id, patientId } });
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

        await reminder.update({
            ...(dosage !== undefined && { dosage }),
            ...(frequency !== undefined && { frequency }),
            ...(reminderTimes !== undefined && { reminderTimes }),
            ...(startDate !== undefined && { startDate }),
            ...(endDate !== undefined && { endDate }),
        });

        return res.json({ reminder });
    } catch (err) {
        console.error('[updateReminder] error:', err);
        return res.status(500).json({ error: 'Failed to update reminder' });
    }
}

/**
 * POST /api/medication-reminders/:id/activate
 * Activates a reminder: schedules BullMQ repeatable jobs, saves job IDs.
 */
async function activateReminder(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;

    try {
        const reminder = await MedicationReminder.findOne({ where: { id, patientId } });
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        if (reminder.isActive) return res.json({ reminder, message: 'Already active' });

        const jobIds = await scheduleReminder(reminder);

        await reminder.update({
            isActive: true,
            bullJobIds: jobIds,
            confirmedAt: new Date(),
        });

        return res.json({ reminder, jobIds });
    } catch (err) {
        console.error('[activateReminder] error:', err);
        return res.status(500).json({ error: 'Failed to activate reminder' });
    }
}

/**
 * POST /api/medication-reminders/:id/deactivate
 * Deactivates a reminder: removes BullMQ repeatable jobs.
 */
async function deactivateReminder(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;

    try {
        const reminder = await MedicationReminder.findOne({ where: { id, patientId } });
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        if (!reminder.isActive) return res.json({ reminder, message: 'Already inactive' });

        await unscheduleReminder(reminder);
        await reminder.update({ isActive: false, bullJobIds: [] });

        return res.json({ reminder });
    } catch (err) {
        console.error('[deactivateReminder] error:', err);
        return res.status(500).json({ error: 'Failed to deactivate reminder' });
    }
}

/**
 * GET /api/medication-reminders/today
 * Returns all active reminder doses for today, with status: taken | upcoming | missed.
 */
async function getTodaysMeds(req, res) {
    const patientId = req.user.id;
    const today = todayDateStr();

    try {
        const reminders = await MedicationReminder.findAll({
            where: {
                patientId,
                isActive: true,
                startDate: { [Op.lte]: today },
                [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: today } }],
            },
        });

        // Fetch taken logs for today
        const reminderIds = reminders.map((r) => r.id);
        const logs = reminderIds.length
            ? await MedicationLog.findAll({
                where: { reminderId: { [Op.in]: reminderIds }, date: today, status: 'taken' },
            })
            : [];

        const takenMap = {};
        for (const log of logs) {
            if (!takenMap[log.reminderId]) takenMap[log.reminderId] = [];
            takenMap[log.reminderId].push(log.time);
        }

        // Expand into one dose entry per reminder_time
        const doses = [];
        for (const reminder of reminders) {
            for (const time of reminder.reminderTimes) {
                doses.push({
                    reminderId: reminder.id,
                    medicineName: reminder.medicineName,
                    dosage: reminder.dosage,
                    frequency: reminder.frequency,
                    time,
                    status: doseStatus(time, takenMap[reminder.id] || []),
                });
            }
        }

        doses.sort((a, b) => a.time.localeCompare(b.time));

        return res.json({ today, doses });
    } catch (err) {
        console.error('[getTodaysMeds] error:', err);
        return res.status(500).json({ error: 'Failed to fetch today\'s medications' });
    }
}

/**
 * POST /api/medication-reminders/:id/taken
 * Body: { time } — logs a dose as taken for today.
 * Uses upsert to prevent duplicate taken entries.
 */
async function markTaken(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;
    const { time } = req.body;

    if (!time) return res.status(400).json({ error: 'time is required (HH:MM)' });

    try {
        const reminder = await MedicationReminder.findOne({ where: { id, patientId } });
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

        const today = todayDateStr();
        const [log, created] = await MedicationLog.upsert(
            { reminderId: id, date: today, time, status: 'taken', loggedAt: new Date() },
            { conflictFields: ['reminder_id', 'date', 'time'], returning: true }
        );

        return res.json({ log, created });
    } catch (err) {
        console.error('[markTaken] error:', err);
        return res.status(500).json({ error: 'Failed to mark dose as taken' });
    }
}

module.exports = {
    extractAndCreate,
    listReminders,
    updateReminder,
    activateReminder,
    deactivateReminder,
    getTodaysMeds,
    markTaken,
};
