const { Queue, DoctorProfile, User, Consultation } = require('../models');
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

    // Allow doctorId to be null for an open pool request, but validate if provided.
    // if (!doctorId) {
    //     return res.status(400).json({ error: 'doctorId is required' });
    // }

    try {
        let doctor = null;
        if (doctorId) {
            doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }
        }

        // Check for duplicate active request
        const existing = await Queue.findOne({
            where: {
                patientId,
                status: QUEUE_STATUS.WAITING, // Only allow one waiting queue at a time
            },
            include: [{ model: DoctorProfile, as: 'doctor' }]
        });

        if (existing) {
            const docName = existing.doctor?.fullName || 'a doctor';
            return res.status(409).json({
                error: `You already have an active request with ${docName} (Token #${existing.tokenNumber}). Cancel it first to book with a different doctor.`,
                queue: existing,
            });
        }

        // Auto-increment token: count existing WAITING entries for this doctor today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const queueCount = await Queue.count({
            where: {
                doctorId: doctorId || null,
                status: QUEUE_STATUS.WAITING,
            },
        });
        const tokenNumber = queueCount + 1;

        const queueEntry = await Queue.create({
            patientId,
            doctorId: doctorId || null,
            clinicId: doctor ? doctor.clinicId : null,
            tokenNumber,
            status: QUEUE_STATUS.WAITING,
        });

        // ── WhatsApp booking confirmation (fire-and-forget) ──────────────────
        User.findByPk(patientId).then((patientUser) => {
            if (patientUser?.phone) {
                const phone = patientUser.phone.replace('+', '');
                const docName = doctor ? (doctor.fullName || 'your doctor') : 'the next available doctor';
                enqueueFreeText(
                    phone,
                    `✅ *Appointment Confirmed!*\n\nYou are in the queue for *${docName}* (Token #${tokenNumber}).\n\nReply *MENU* on WhatsApp to view or manage your appointments.`
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
            where: {
                patientId: req.user.id,
                status: ['WAITING', 'SERVING']
            },
            order: [['createdAt', 'DESC']],
            raw: true
        });

        // For each entry, attach the active consultation (if they were accepted)
        const entriesWithConsultations = await Promise.all(entries.map(async (q) => {
            if (q.status === 'SERVING') {
                const consultation = await Consultation.findOne({
                    where: { patientId: req.user.id, doctorId: q.doctorId },
                    order: [['createdAt', 'DESC']],
                    raw: true
                });
                return { ...q, consultation };
            }
            return q;
        }));

        return res.json({ queue: entriesWithConsultations });
    } catch (err) {
        console.error('[myQueue] error:', err);
        return res.status(500).json({ error: 'Failed to fetch queue' });
    }
}

module.exports = { requestConsultation, myQueue };
