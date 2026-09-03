const { Op } = require('sequelize');
const { Consultation, DoctorProfile, ClinicProfile } = require('../models');
const { CONSULTATION_STATUS } = require('../models/consultationModel');
const { generateSummary } = require('../services/summaryService');

/**
 * GET /api/consultations/me
 * Returns all consultations for the logged-in patient, paginated, most-recent first.
 * Joins doctor name, specialization and clinic name.
 */
async function getMyConsultations(req, res) {
    const patientId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await Consultation.findAndCountAll({
            where: { patientId },
            include: [
                {
                    model: DoctorProfile,
                    as: 'doctor',
                    attributes: ['userId', 'fullName', 'specialization', 'consultationFee'],
                },
                {
                    model: ClinicProfile,
                    as: 'clinic',
                    attributes: ['userId', 'clinicName', 'address', 'city'],
                    required: false,
                },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        return res.json({
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            consultations: rows,
        });
    } catch (err) {
        console.error('[getMyConsultations] error:', err);
        return res.status(500).json({ error: 'Failed to fetch consultations' });
    }
}

/**
 * GET /api/consultations/:id/rejoin
 * Returns room info for an in-progress consultation belonging to the patient.
 */
async function rejoinCall(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;

    try {
        const consultation = await Consultation.findOne({
            where: { id, patientId },
        });

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        if (consultation.status !== CONSULTATION_STATUS.IN_PROGRESS) {
            return res.status(400).json({
                error: 'This consultation is not currently in progress',
                status: consultation.status,
            });
        }

        return res.json({
            consultationId: consultation.id,
            roomId: consultation.roomId,
            doctorId: consultation.doctorId,
        });
    } catch (err) {
        console.error('[rejoinCall] error:', err);
        return res.status(500).json({ error: 'Failed to fetch call info' });
    }
}

/**
 * POST /api/consultations/:id/summary
 * Generates (or returns cached) AI plain-language summary for a completed consultation.
 *
 * Cache logic:
 *   - If aiSummary exists AND aiSummaryGeneratedAt > updatedAt: return cached summary.
 *   - Otherwise: call Gemini, store result.
 *   - If no notes/prescriptionText: return { aiSummary: null } — don't call Gemini.
 */
async function generateAiSummary(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;

    try {
        const consultation = await Consultation.findOne({ where: { id, patientId } });

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        if (consultation.status !== CONSULTATION_STATUS.COMPLETED) {
            return res.status(400).json({ error: 'Summary only available for completed consultations' });
        }

        const notesText = consultation.prescriptionText || consultation.notes;
        if (!notesText?.trim()) {
            return res.json({ aiSummary: null, cached: false, reason: 'no_notes' });
        }

        // Cache hit: summary exists and was generated after the last update
        const isStale =
            !consultation.aiSummaryGeneratedAt ||
            new Date(consultation.aiSummaryGeneratedAt) < new Date(consultation.updatedAt);

        if (consultation.aiSummary && !isStale) {
            return res.json({ aiSummary: consultation.aiSummary, cached: true });
        }

        // Generate new summary
        const summary = await generateSummary(notesText);

        await consultation.update({
            aiSummary: summary,
            aiSummaryGeneratedAt: new Date(),
        });

        return res.json({ aiSummary: summary, cached: false });
    } catch (err) {
        console.error('[generateAiSummary] error:', err);
        return res.status(500).json({ error: 'Failed to generate summary' });
    }
}

/**
 * POST /api/consultations/:id/end
 * Allows a patient to manually hang up/terminate their active consultation.
 * This explicitly closes the queue entry so it no longer loops on the dashboard.
 */
async function endCallByPatient(req, res) {
    try {
        const { id } = req.params;
        const consultation = await Consultation.findByPk(id);

        if (!consultation || consultation.patientId !== req.user.id) {
            return res.status(404).json({ error: 'Consultation not found or unauthorized' });
        }

        // Only mark it completed if it's currently active in some form
        if (['assigned', 'in_progress', 'disconnected'].includes(consultation.status)) {
            consultation.status = 'completed';
            consultation.webrtcStatus = 'completed';
            await consultation.save();

            // Clear the queue tracking row
            const { Queue } = require('../models');
            const queue = await Queue.findOne({ where: { patientId: consultation.patientId, doctorId: consultation.doctorId, status: 'SERVING' } });
            if (queue) {
                queue.status = 'COMPLETED';
                await queue.save();
            }

            // Prune dangling socket disconnect timers
            const timers = req.app.get('disconnectTimers');
            if (timers && timers.has(consultation.roomId)) {
                clearTimeout(timers.get(consultation.roomId));
                timers.delete(consultation.roomId);
            }

            // Immediately notify the remote doctor directly so they are cleanly kicked out
            const io = req.app.get('io');
            if (io) {
                io.to(`user:${consultation.doctorId}`).emit('consultation:completed', { consultationId: id });
            }
        }

        return res.json({ success: true, message: 'Consultation ended successfully' });
    } catch (err) {
        console.error('[endCallByPatient] error:', err);
        return res.status(500).json({ error: 'Failed to end call' });
    }
}

/**
 * GET /api/consultations/timeline
 * Returns chronological symptom timeline for the logged-in patient.
 * Each entry includes: date, reportedSymptoms, doctor name/specialization, aiSummary if available.
 */
async function getTimeline(req, res) {
    const patientId = req.user.id;

    try {
        const consultations = await Consultation.findAll({
            where: {
                patientId,
                status: { [Op.in]: [CONSULTATION_STATUS.COMPLETED, CONSULTATION_STATUS.IN_PROGRESS] },
            },
            include: [
                {
                    model: DoctorProfile,
                    as: 'doctor',
                    attributes: ['fullName', 'specialization'],
                },
            ],
            order: [['createdAt', 'ASC']],
            attributes: [
                'id',
                'createdAt',
                'scheduledAt',
                'status',
                'reportedSymptoms',
                'aiSummary',
                'notes',
            ],
        });

        const timeline = consultations.map((c) => ({
            consultationId: c.id,
            date: c.scheduledAt || c.createdAt,
            reportedSymptoms: c.reportedSymptoms || null,
            doctor: c.doctor?.fullName || 'Doctor',
            specialization: c.doctor?.specialization || null,
            diagnosis: c.aiSummary || (c.notes ? c.notes.slice(0, 200) : null),
            status: c.status,
        }));

        return res.json({ timeline });
    } catch (err) {
        console.error('[getTimeline] error:', err);
        return res.status(500).json({ error: 'Failed to fetch timeline' });
    }
}

module.exports = { getMyConsultations, rejoinCall, generateAiSummary, getTimeline, endCallByPatient };
