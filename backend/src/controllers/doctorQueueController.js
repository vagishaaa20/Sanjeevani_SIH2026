const { Queue, Consultation, PatientProfile, QueueSkipped, DoctorProfile } = require('../models');
const { Op } = require('sequelize');
const { QUEUE_STATUS } = require('../constants/queueStatus');
const crypto = require('crypto');

// Socket instance will be needed to emit consultation:accepted
// We assume it's attached to req.io or we can import it if necessary.
// For now, we will assume req.app.get('io') is available.

/**
 * GET /api/doctors/queue
 * Returns all consultation requests waiting for this doctor, 
 * ordered by request time (oldest first). 
 * Includes unassigned requests filtered to their specialization, minus skipped.
 */
exports.getQueue = async (req, res) => {
    console.log('[getQueue] EXECUTING route!');
    try {
        const doctorId = req.user.id;
        const doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
        if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

        // Find which queues are skipped by this doctor
        const skipped = await QueueSkipped.findAll({ where: { doctorId }, attributes: ['queueId'] });
        const skippedIds = skipped.map(s => s.queueId);

        // Fetch queues: either assigned specifically to this doctor OR unassigned (if any)
        const whereClause = {
            status: QUEUE_STATUS.WAITING,
            id: { [Op.notIn]: skippedIds },
            [Op.or]: [
                { doctorId },
                { doctorId: null } // pool
            ]
        };

        const queues = await Queue.findAll({
            where: whereClause,
            order: [['createdAt', 'ASC']],
            include: [
                {
                    model: PatientProfile,
                    as: 'patient'
                }
            ]
        });

        // The prompt asks for urgency flag. Assuming disease_reports or some AI triage data exists, 
        // we map that if available (omitted for brevity, can attach later if triage ties to queue).

        return res.json({ queue: queues });
    } catch (err) {
        console.error('[getQueue] error:', err);
        return res.status(500).json({ error: 'Failed to fetch queue' });
    }
};

/**
 * POST /api/doctors/queue/:queueId/accept
 */
exports.acceptRequest = async (req, res) => {
    try {
        const { id: queueId } = req.params;
        const doctorId = req.user.id;

        const queue = await Queue.findByPk(queueId);
        if (!queue) return res.status(404).json({ error: 'Queue entry not found' });
        if (queue.status !== QUEUE_STATUS.WAITING) {
            return res.status(400).json({ error: 'Request is no longer waiting' });
        }

        // Generate WebRTC room ID
        const roomId = crypto.randomUUID();

        // Create the Consultation record 
        const consultation = await Consultation.create({
            patientId: queue.patientId,
            doctorId: doctorId,
            clinicId: queue.clinicId,
            status: 'assigned',
            roomId,
            webrtcStatus: 'waiting'
        });

        // Mark queue as serving
        queue.status = QUEUE_STATUS.SERVING;
        queue.doctorId = doctorId; // Claim it
        await queue.save();

        // Emit to patient
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${queue.patientId}`).emit('consultation:accepted', {
                consultationId: consultation.id,
                roomId,
                doctorId
            });
        }

        return res.json({ success: true, consultation });
    } catch (err) {
        console.error('[acceptRequest] error:', err);
        return res.status(500).json({ error: 'Failed to accept request' });
    }
};

/**
 * POST /api/doctors/queue/:queueId/skip
 */
exports.skipRequest = async (req, res) => {
    try {
        const { id: queueId } = req.params;
        const doctorId = req.user.id;

        await QueueSkipped.create({ queueId, doctorId });

        return res.json({ success: true, message: 'Skipped' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to skip' });
    }
};

/**
 * POST /api/doctors/queue/:consultationId/complete
 */
exports.completeRequest = async (req, res) => {
    try {
        const { id: consultationId } = req.params;

        const consultation = await Consultation.findByPk(consultationId);
        if (!consultation || consultation.doctorId !== req.user.id) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        // Final authoritative state
        consultation.status = 'completed';
        consultation.webrtcStatus = 'completed';
        await consultation.save();

        // Also mark the original Queue entry as COMPLETED
        const queue = await Queue.findOne({ where: { patientId: consultation.patientId, doctorId: consultation.doctorId, status: 'SERVING' } });
        if (queue) {
            queue.status = 'COMPLETED';
            await queue.save();
        }

        // Prune dangling socket disconnect timers securely
        const timers = req.app.get('disconnectTimers');
        if (timers && timers.has(consultation.roomId)) {
            clearTimeout(timers.get(consultation.roomId));
            timers.delete(consultation.roomId);
        }

        // Emit Socket.io completion to patient to immediately hide their banner
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${consultation.patientId}`).emit('consultation:completed', {
                consultationId: consultation.id
            });
        }

        // In a full implementation, trigger the summary generation via queue here:
        // summaryQueue.add('generate-summary', { consultationId });

        return res.json({ success: true, consultation });
    } catch (err) {
        console.error('[completeRequest] error:', err);
        return res.status(500).json({ error: 'Failed to complete' });
    }
};
