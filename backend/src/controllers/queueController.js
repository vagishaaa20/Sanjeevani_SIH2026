const { Queue, DoctorProfile, User, Consultation, Appointment, PatientProfile, ClinicProfile } = require('../models');
const { QUEUE_STATUS } = require('../constants/queueStatus');
const { enqueueFreeText } = require('../services/waCloudService');
const crypto = require('crypto');
const { Op } = require('sequelize');

/**
 * POST /api/queues/request
 * Body: { doctorId?, clinicId?, specialization?, symptoms?, urgency?, temporaryDiagnosis?, appointmentDate?, estimatedTime? }
 * Patient requests a consultation either with a specific doctor, clinic, or a specialty pool.
 * Creates a WAITING queue entry with an auto-incremented token number.
 */
async function requestConsultation(req, res) {
    const { 
        doctorId, 
        clinicId, 
        specialization, 
        symptoms, 
        urgency = 'low', 
        temporaryDiagnosis, 
        appointmentDate, 
        estimatedTime 
    } = req.body;
    const patientId = req.user.id;

    try {
        let doctor = null;
        if (doctorId) {
            doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }
        }

        // Prevent overlapping active requests if already WAITING or SERVING
        const existing = await Queue.findOne({
            where: {
                patientId,
                status: { [Op.in]: [QUEUE_STATUS.WAITING, QUEUE_STATUS.SERVING] },
            }
        });

        if (existing) {
            return res.status(409).json({
                error: `You already have an active request. Cancel it first to book anew.`,
                queue: existing
            });
        }

        // Auto-increment token count for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const whereCount = { status: QUEUE_STATUS.WAITING };
        if (doctorId) whereCount.doctorId = doctorId;
        else if (clinicId) whereCount.clinicId = clinicId;

        const queueCount = await Queue.count({ where: whereCount });
        const tokenNumber = queueCount + 1;

        const queueEntry = await Queue.create({
            patientId,
            doctorId: doctorId || null,
            clinicId: clinicId || (doctor ? doctor.clinicId : null),
            specialization: specialization || (doctor ? doctor.specialization : null),
            symptoms: symptoms || null,
            urgency: urgency || 'low',
            temporaryDiagnosis: temporaryDiagnosis || null,
            acceptedDoctorIds: [],
            appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
            estimatedTime: estimatedTime || null,
            tokenNumber,
            status: QUEUE_STATUS.WAITING,
        });

        // Broadcast to relevant doctors / clinics via Socket.io
        const io = req.app.get('io');
        if (io) {
            const patient = await PatientProfile.findByPk(patientId);
            const payload = {
                ...queueEntry.toJSON(),
                patient: patient ? {
                    fullName: patient.fullName,
                    gender: patient.gender,
                    age: patient.age,
                    region: patient.region
                } : null
            };

            // Broadcast to all doctors
            io.to('doctors').emit('queue:new_request', payload);
            io.to('doctors').emit('queue:new_patient', payload);
            if (doctorId) {
                io.to(`user:${doctorId}`).emit('queue:new_request', payload);
            }
        }

        // ── WhatsApp booking confirmation (fire-and-forget) ──────────────────
        User.findByPk(patientId).then((patientUser) => {
            if (patientUser?.phone) {
                const phone = patientUser.phone.replace('+', '');
                const docName = doctor ? (doctor.fullName || 'your doctor') : (specialization ? `${specialization} Specialist` : 'the next available doctor');
                enqueueFreeText(
                    phone,
                    `✅ *Appointment Request Placed!*\n\nYou are in the queue for *${docName}* (Token #${tokenNumber}).\n\nReply *MENU* on WhatsApp to view or manage your appointments.`
                ).catch((err) => console.error('[queueController] WhatsApp enqueue failed:', err.message));
            }
        }).catch(() => { });

        return res.status(201).json({
            message: 'Consultation request submitted. You are now in the queue.',
            queue: queueEntry,
        });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                error: 'Database error: You already have an active or serving queue request globally.'
            });
        }
        console.error('[requestConsultation] error:', err);
        return res.status(500).json({
            error: process.env.NODE_ENV === 'development' ? err.message : 'Failed to submit request',
        });
    }
}

/**
 * POST /api/queues/:id/select-doctor
 * Patient selects ONE doctor from the list of doctors who accepted their broadcast request.
 * Transitions queue to SERVING, creates Consultation with roomId, and closes other doctor invitations.
 */
async function selectDoctor(req, res) {
    try {
        const { id: queueId } = req.params;
        const { doctorId, selectedSlot } = req.body;
        const patientId = req.user.id;

        if (!doctorId) {
            return res.status(400).json({ error: 'doctorId is required to select doctor' });
        }

        const queue = await Queue.findByPk(queueId);
        if (!queue || queue.patientId !== patientId) {
            return res.status(404).json({ error: 'Queue request not found or unauthorized' });
        }

        if (queue.status !== QUEUE_STATUS.WAITING) {
            return res.status(400).json({ error: 'This consultation request is no longer waiting.' });
        }

        const doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
        if (!doctor) {
            return res.status(404).json({ error: 'Selected doctor profile not found' });
        }

        // Safely determine scheduled time
        let parsedScheduledAt = new Date();
        let slotDisplay = 'Online Teleconsultation';

        if (selectedSlot) {
            if (typeof selectedSlot === 'object') {
                slotDisplay = selectedSlot.label || selectedSlot.offeredTimeSlot || slotDisplay;
                if (selectedSlot.startTime) {
                    const d = new Date(selectedSlot.startTime);
                    if (!isNaN(d.getTime())) parsedScheduledAt = d;
                }
            } else if (typeof selectedSlot === 'string') {
                slotDisplay = selectedSlot;
                const d = new Date(selectedSlot);
                if (!isNaN(d.getTime())) parsedScheduledAt = d;
            }
        } else if (queue.appointmentDate) {
            const d = new Date(queue.appointmentDate);
            if (!isNaN(d.getTime())) parsedScheduledAt = d;
        }

        // Generate WebRTC room ID
        const roomId = crypto.randomUUID();

        // Create the Consultation record
        const consultation = await Consultation.create({
            patientId: queue.patientId,
            doctorId: doctorId,
            clinicId: queue.clinicId || doctor.clinicId,
            status: 'assigned',
            roomId,
            webrtcStatus: 'waiting',
            reportedSymptoms: queue.symptoms,
            scheduledAt: parsedScheduledAt,
        });

        // Atomically update queue status
        queue.status = QUEUE_STATUS.SERVING;
        queue.doctorId = doctorId;
        queue.selectedDoctorId = doctorId;
        await queue.save();

        // Real-time socket events
        const io = req.app.get('io');
        if (io) {
            // Notify patient with room info
            io.to(`user:${patientId}`).emit('consultation:accepted', {
                consultationId: consultation.id,
                roomId,
                doctorId,
                doctorName: doctor.fullName,
            });
            io.to(`user:${patientId}`).emit('consultation:confirmed', {
                consultationId: consultation.id,
                roomId,
                doctorId,
                doctorName: doctor.fullName,
            });

            // Notify selected doctor to join room
            io.to(`user:${doctorId}`).emit('consultation:assigned', {
                consultationId: consultation.id,
                roomId,
                patientId: queue.patientId,
            });

            // Notify all other doctors that this broadcast queue is withdrawn/claimed
            io.to('doctors').emit('queue:withdrawn', {
                queueId: queue.id,
                assignedDoctorId: doctorId,
            });
            io.to('doctors').emit('queue:update', {
                queueId: queue.id,
                status: QUEUE_STATUS.SERVING,
            });
        }

        return res.json({
            success: true,
            message: `Dr. ${doctor.fullName} selected successfully. Connecting to consultation.`,
            consultation,
            queue
        });
    } catch (err) {
        console.error('[selectDoctor] error:', err);
        return res.status(500).json({ error: 'Failed to confirm doctor selection' });
    }
}

/**
 * GET /api/queues/my
 * Returns all active queue entries for the logged-in patient, with doctor details and accepted doctors list.
 */
async function myQueue(req, res) {
    try {
        const entries = await Queue.findAll({
            where: {
                patientId: req.user.id,
                status: { [Op.in]: [QUEUE_STATUS.WAITING, QUEUE_STATUS.SERVING] }
            },
            include: [
                {
                    model: DoctorProfile,
                    as: 'doctor',
                    attributes: ['userId', 'fullName', 'specialization', 'consultationFee', 'avgRating', 'yearsOfExperience'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
        });

        // For each entry, attach the active consultation (if they were accepted/serving)
        const entriesWithDetails = await Promise.all(entries.map(async (q) => {
            const rawQ = q.toJSON();
            if (rawQ.status === QUEUE_STATUS.SERVING && rawQ.doctorId) {
                const consultation = await Consultation.findOne({
                    where: { 
                        patientId: req.user.id, 
                        doctorId: rawQ.doctorId,
                        status: { [Op.in]: ['assigned', 'in_progress', 'waiting'] }
                    },
                    order: [['createdAt', 'DESC']],
                    raw: true
                });
                return { ...rawQ, consultation };
            }
            return rawQ;
        }));

        return res.json({ queue: entriesWithDetails });
    } catch (err) {
        console.error('[myQueue] error:', err);
        return res.status(500).json({ error: 'Failed to fetch queue' });
    }
}

/**
 * POST /api/queues/:id/cancel
 * Allows a patient to unilaterally cancel their own requested WAITING queue if no doctor has accepted it yet.
 */
async function cancelQueue(req, res) {
    try {
        const { id } = req.params;
        const queue = await Queue.findByPk(id);

        if (!queue || queue.patientId !== req.user.id) {
            return res.status(404).json({ error: 'Queue request not found or unauthorized' });
        }

        if (queue.status !== QUEUE_STATUS.WAITING) {
            return res.status(400).json({ error: 'Only WAITING queue requests can be cancelled.' });
        }

        queue.status = QUEUE_STATUS.CANCELLED;
        await queue.save();

        const io = req.app.get('io');
        if (io) {
            io.to('doctors').emit('queue:withdrawn', { queueId: queue.id });
        }

        return res.json({ success: true, message: 'Consultation request cancelled successfully' });
    } catch (err) {
        console.error('[cancelQueue] error:', err);
        return res.status(500).json({ error: 'Failed to cancel queue request' });
    }
}

module.exports = { requestConsultation, selectDoctor, myQueue, cancelQueue };
