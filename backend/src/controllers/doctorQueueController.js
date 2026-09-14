const { Queue, Consultation, PatientProfile, QueueSkipped, DoctorProfile, Appointment } = require('../models');
const { Op } = require('sequelize');
const { QUEUE_STATUS } = require('../constants/queueStatus');
const crypto = require('crypto');

/**
 * GET /api/doctors/queue
 * Returns all consultation requests waiting for this doctor, 
 * ordered by request time (oldest first). 
 * Includes unassigned requests filtered to their specialization, minus skipped.
 */
exports.getQueue = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
        if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

        // Find which queues are skipped by this doctor
        const skipped = await QueueSkipped.findAll({ where: { doctorId }, attributes: ['queueId'] });
        const skippedIds = skipped.map(s => s.queueId);

        // Split doctor specialization into tokens
        const rawDoctorSpec = doctor.specialization || '';
        const doctorTokens = rawDoctorSpec
            .toLowerCase()
            .split(/[,/&]+/)
            .map(t => t.trim())
            .filter(t => t.length > 2);

        // Build specialization matching OR clauses:
        // 1. If queue has specialization: null or empty
        // 2. If queue specialization is 'General Physician' / 'General Medicine' / 'Any'
        // 3. If queue specialization matches any doctor token (e.g. %pediatrics%, %gastroenterology%, %surgery%)
        // 4. If doctor's specialization matches queue's specialization
        const specConditions = [
            { specialization: null },
            { specialization: '' },
            { specialization: { [Op.iLike]: '%general%' } },
            { specialization: { [Op.iLike]: '%physician%' } },
            { specialization: { [Op.iLike]: '%medicine%' } },
        ];

        for (const token of doctorTokens) {
            specConditions.push({ specialization: { [Op.iLike]: `%${token}%` } });
            // Also split words within token (e.g. 'pediatrics')
            const words = token.split(/\s+/).filter(w => w.length > 3);
            for (const word of words) {
                specConditions.push({ specialization: { [Op.iLike]: `%${word}%` } });
            }
        }

        const whereClause = {
            status: QUEUE_STATUS.WAITING,
            id: { [Op.notIn]: skippedIds },
            [Op.or]: [
                { doctorId },
                { 
                    doctorId: null,
                    [Op.or]: specConditions
                }
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

        // Enrich with isOfferedByMe indicator
        const enrichedQueues = queues.map(q => {
            const raw = q.toJSON();
            const acceptedList = Array.isArray(raw.acceptedDoctorIds) ? raw.acceptedDoctorIds : [];
            const isOfferedByMe = acceptedList.some(item => (typeof item === 'object' ? item?.doctorId : item) === doctorId);
            return {
                ...raw,
                isOfferedByMe,
                acceptedDoctorCount: acceptedList.length,
            };
        });

        return res.json({ queue: enrichedQueues });
    } catch (err) {
        console.error('[getQueue] error:', err);
        return res.status(500).json({ error: 'Failed to fetch queue' });
    }
};

/**
 * POST /api/doctors/queue/:queueId/accept
 * If direct booking: claims queue immediately and creates Consultation.
 * If broadcast booking: adds doctor to acceptedDoctorIds and notifies patient.
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

        const doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
        if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

        const io = req.app.get('io');

        // Case 1: Direct 1-to-1 doctor request
        if (queue.doctorId === doctorId) {
            const roomId = crypto.randomUUID();
            const consultation = await Consultation.create({
                patientId: queue.patientId,
                doctorId: doctorId,
                clinicId: queue.clinicId || doctor.clinicId,
                status: 'assigned',
                roomId,
                webrtcStatus: 'waiting',
                reportedSymptoms: queue.symptoms,
                scheduledAt: queue.appointmentDate || new Date()
            });

            queue.status = QUEUE_STATUS.SERVING;
            queue.selectedDoctorId = doctorId;
            await queue.save();

            if (io) {
                io.to(`user:${queue.patientId}`).emit('consultation:accepted', {
                    consultationId: consultation.id,
                    roomId,
                    doctorId,
                    doctorName: doctor.fullName
                });
            }

            return res.json({ 
                success: true, 
                direct: true, 
                consultation,
                message: 'Consultation started successfully' 
            });
        }

        // Case 2: Specialty pool broadcast request
        const { offeredTimeSlot, customNote } = req.body || {};
        const slotLabel = typeof offeredTimeSlot === 'object' 
            ? (offeredTimeSlot?.label || 'Right Now · Immediate (Next 5–10 mins)')
            : (offeredTimeSlot || 'Right Now · Immediate (Next 5–10 mins)');

        const currentAccepted = Array.isArray(queue.acceptedDoctorIds) ? [...queue.acceptedDoctorIds] : [];
        const existingIndex = currentAccepted.findIndex(item => (typeof item === 'object' ? item?.doctorId : item) === doctorId);

        const doctorOffer = {
            doctorId: doctor.userId,
            fullName: doctor.fullName,
            specialization: doctor.specialization,
            consultationFee: doctor.teleconsultationFee || doctor.consultationFee || 500,
            avgRating: doctor.avgRating || '5.0',
            yearsOfExperience: doctor.yearsOfExperience || 0,
            clinicName: doctor.clinicOrHospital,
            offeredTimeSlot: slotLabel,
            slotMetadata: typeof offeredTimeSlot === 'object' ? offeredTimeSlot : null,
            customNote: customNote || null,
            acceptedAt: new Date(),
        };

        if (existingIndex >= 0) {
            currentAccepted[existingIndex] = doctorOffer;
        } else {
            currentAccepted.push(doctorOffer);
        }

        queue.acceptedDoctorIds = currentAccepted;
        await queue.save();

        // Emit to patient so their comparison card updates instantly with offered time slot
        if (io) {
            io.to(`user:${queue.patientId}`).emit('consultation:doctor_accepted', {
                queueId: queue.id,
                doctor: doctorOffer,
                acceptedDoctors: currentAccepted
            });
        }

        return res.json({ 
            success: true, 
            direct: false, 
            message: `Your teleconsultation slot (${formattedSlot}) has been sent to the patient.`,
            offeredTimeSlot: formattedSlot,
            queue 
        });
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


