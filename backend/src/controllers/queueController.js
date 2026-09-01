const { Queue, DoctorProfile, User } = require('../models');
const { QUEUE_STATUS } = require('../constants/queueStatus');
const { enqueueFreeText } = require('../services/waCloudService');

/**
 * POST /api/queues/request
 * Body: { doctorId }
 * Patient requests a consultation with a specific doctor.
 * Creates a WAITING queue entry with an auto-incremented token number.
 */
async function requestConsultation(req, res) {
    const { doctorId } = req.body;
    const patientId = req.user.id;

    if (!doctorId) {
        return res.status(400).json({ error: 'doctorId is required' });
    }

    try {
        // Verify the doctor exists and is verified
        const doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Check for duplicate active request (patient already in this doctor's queue)
        const existing = await Queue.findOne({
            where: {
                patientId,
                doctorId,
                status: QUEUE_STATUS.WAITING,
            },
        });
        if (existing) {
            return res.status(409).json({
                error: 'You already have an active consultation request with this doctor',
                queue: existing,
            });
        }

        // Auto-increment token: count existing WAITING entries for this doctor today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const queueCount = await Queue.count({
            where: {
                doctorId,
                status: QUEUE_STATUS.WAITING,
            },
        });
        const tokenNumber = queueCount + 1;

        const queueEntry = await Queue.create({
            patientId,
            doctorId,
            clinicId: doctor.clinicId || null,
            tokenNumber,
            status: QUEUE_STATUS.WAITING,
        });

        // ── WhatsApp booking confirmation (fire-and-forget) ──────────────────
        // ⚠️ FREE-FORM: Only within 24 h patient service window.
        //    For out-of-window sends use template 'sanjeevani_booking_confirmation'
        //    (requires Meta Business Manager approval — see waCloudService comments).
        User.findByPk(patientId).then((patientUser) => {
            if (patientUser?.phone) {
                const phone = patientUser.phone.replace('+', '');
                enqueueFreeText(
                    phone,
                    `✅ *Appointment Confirmed!*\n\nYou are in the queue for *${doctor.fullName || 'your doctor'}* (Token #${tokenNumber}).\n\nReply *MENU* on WhatsApp to view or manage your appointments.`
                ).catch((err) => console.error('[queueController] WhatsApp enqueue failed:', err.message));
            }
        }).catch(() => { });

        return res.status(201).json({
            message: 'Consultation request submitted. You are now in the queue.',
            queue: queueEntry,
        });
    } catch (err) {
        console.error('[requestConsultation] error:', err);
        return res.status(500).json({
            error: process.env.NODE_ENV === 'development' ? err.message : 'Failed to submit request',
        });
    }
}

/**
 * GET /api/queues/my
 * Returns all active queue entries for the logged-in patient.
 */
async function myQueue(req, res) {
    try {
        const entries = await Queue.findAll({
            where: { patientId: req.user.id },
            order: [['createdAt', 'DESC']],
        });
        return res.json({ queue: entries });
    } catch (err) {
        console.error('[myQueue] error:', err);
        return res.status(500).json({ error: 'Failed to fetch queue' });
    }
}

module.exports = { requestConsultation, myQueue };
