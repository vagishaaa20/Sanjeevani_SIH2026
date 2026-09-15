const { Appointment, DoctorProfile, PatientProfile, ClinicProfile, User } = require('../models');
const { enqueueFreeText } = require('../services/waCloudService');
const { Op } = require('sequelize');

/**
 * POST /api/appointments
 * Patient books an in-person clinic visit with a specific doctor and time slot.
 */
async function bookAppointment(req, res) {
    try {
        const { 
            doctorId, 
            clinicId, 
            appointmentDate, 
            timeSlot, 
            symptoms, 
            notes,
            type = 'clinic_visit' 
        } = req.body;
        const patientId = req.user.id;

        if (!doctorId) {
            return res.status(400).json({ error: 'doctorId is required to book an in-person clinic appointment' });
        }

        if (!appointmentDate) {
            return res.status(400).json({ error: 'appointmentDate is required' });
        }

        const doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const targetClinicId = clinicId || doctor.clinicId || null;

        // Calculate token number for this doctor on the selected date
        const parsedDate = new Date(appointmentDate);
        const dayStart = new Date(parsedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(parsedDate);
        dayEnd.setHours(23, 59, 59, 999);

        const appointmentCount = await Appointment.count({
            where: {
                doctorId,
                appointmentDate: {
                    [Op.between]: [dayStart, dayEnd]
                }
            }
        });
        const tokenNumber = appointmentCount + 1;

        const appointment = await Appointment.create({
            patientId,
            doctorId,
            clinicId: targetClinicId,
            appointmentDate: parsedDate,
            timeSlot: timeSlot || 'Regular OPD Slot',
            type,
            status: 'scheduled',
            symptoms: symptoms || null,
            notes: notes || null,
            tokenNumber,
        });

        // Load patient profile for socket broadcast
        const patient = await PatientProfile.findByPk(patientId);

        // Fetch populated appointment
        const populated = await Appointment.findByPk(appointment.id, {
            include: [
                {
                    model: DoctorProfile,
                    as: 'doctor',
                    attributes: ['userId', 'fullName', 'specialization', 'clinicOrHospital', 'address', 'city', 'state', 'pincode', 'consultationFee']
                },
                {
                    model: PatientProfile,
                    as: 'patient',
                    attributes: ['userId', 'fullName', 'sex', 'dateOfBirth', 'region', 'abhaNumber']
                }
            ]
        });

        // Real-time socket notification to doctor and patient
        const io = req.app.get('io');
        if (io) {
            const payload = populated ? populated.toJSON() : appointment.toJSON();
            // Notify doctor of new clinic appointment
            io.to(`user:${doctorId}`).emit('appointment:new', payload);
            io.to(`user:${patientId}`).emit('appointment:confirmed', payload);
        }

        // WhatsApp booking confirmation (fire-and-forget)
        User.findByPk(patientId).then((patientUser) => {
            if (patientUser?.phone) {
                const phone = patientUser.phone.replace('+', '');
                const dateStr = parsedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                const timeStr = timeSlot || 'OPD hours';
                enqueueFreeText(
                    phone,
                    `[In-Person Clinic Visit Confirmed]\n\nDoctor: Dr. ${doctor.fullName}\nDate: ${dateStr} (${timeStr})\nClinic: ${doctor.clinicOrHospital || 'Clinic Chamber'}\nToken: #${tokenNumber}\n\nPlease arrive 10 minutes prior to your scheduled slot.`
                ).catch((err) => console.error('[appointmentController] WhatsApp enqueue failed:', err.message));
            }
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: 'In-person clinic appointment booked successfully.',
            appointment: populated || appointment
        });
    } catch (err) {
        console.error('[bookAppointment] error:', err);
        return res.status(500).json({ error: err.message || 'Failed to book appointment' });
    }
}

/**
 * GET /api/appointments/my
 * Patient gets their list of in-person clinic appointments.
 */
async function getMyAppointments(req, res) {
    try {
        const patientId = req.user.id;
        const appointments = await Appointment.findAll({
            where: { 
                patientId,
                type: { [Op.notIn]: ['teleconsultation'] }
            },
            order: [['appointmentDate', 'DESC'], ['createdAt', 'DESC']],
            include: [
                {
                    model: DoctorProfile,
                    as: 'doctor',
                    attributes: ['userId', 'fullName', 'specialization', 'clinicOrHospital', 'address', 'city', 'state', 'pincode', 'consultationFee']
                }
            ]
        });

        return res.json({ appointments });
    } catch (err) {
        console.error('[getMyAppointments] error:', err);
        return res.status(500).json({ error: 'Failed to fetch your appointments' });
    }
}

/**
 * GET /api/appointments/doctor
 * Doctor gets their list of scheduled in-person clinic appointments.
 */
async function getDoctorAppointments(req, res) {
    try {
        const doctorId = req.user.id;
        const appointments = await Appointment.findAll({
            where: { 
                doctorId,
                type: { [Op.notIn]: ['teleconsultation'] }
            },
            order: [['appointmentDate', 'ASC'], ['createdAt', 'ASC']],
            include: [
                {
                    model: PatientProfile,
                    as: 'patient',
                    attributes: ['userId', 'fullName', 'sex', 'dateOfBirth', 'region', 'abhaNumber']
                }
            ]
        });

        return res.json({ appointments });
    } catch (err) {
        console.error('[getDoctorAppointments] error:', err);
        return res.status(500).json({ error: 'Failed to fetch doctor appointments' });
    }
}

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status (e.g., 'checked_in', 'completed', 'cancelled').
 */
async function updateAppointmentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const appointment = await Appointment.findByPk(id, {
            include: [
                { model: PatientProfile, as: 'patient' },
                { model: DoctorProfile, as: 'doctor' }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (appointment.patientId !== userId && appointment.doctorId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to update this appointment' });
        }

        appointment.status = status;
        await appointment.save();

        const io = req.app.get('io');
        if (io) {
            const payload = appointment.toJSON();
            io.to(`user:${appointment.patientId}`).emit('appointment:status_change', payload);
            io.to(`user:${appointment.doctorId}`).emit('appointment:status_change', payload);
        }

        return res.json({
            success: true,
            message: `Appointment status updated to ${status}`,
            appointment
        });
    } catch (err) {
        console.error('[updateAppointmentStatus] error:', err);
        return res.status(500).json({ error: 'Failed to update appointment status' });
    }
}

/**
 * POST /api/appointments/:id/complete
 * Officially completes an in-person clinic appointment with final diagnosis,
 * prescription/orders for medication reminders, and outbreak severity score for the epidemic heatmap.
 */
async function completeAppointment(req, res) {
    try {
        const { id } = req.params;
        const { notes, finalDiagnosis, prescriptionText, severityScore } = req.body;
        const doctorId = req.user.id;

        const appointment = await Appointment.findByPk(id, {
            include: [
                { model: PatientProfile, as: 'patient' },
                { model: DoctorProfile, as: 'doctor' }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (appointment.doctorId !== doctorId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Only the consulting doctor can complete this appointment.' });
        }

        if (!finalDiagnosis?.trim() && !notes?.trim()) {
            return res.status(400).json({ error: 'Doctor notes or a final diagnosis are required to complete the clinic examination.' });
        }

        appointment.status = 'completed';
        const formattedNotes = [
            notes ? `Clinical Notes: ${notes}` : null,
            finalDiagnosis ? `Diagnosis: ${finalDiagnosis}` : null,
            prescriptionText ? `Prescription: ${prescriptionText}` : null
        ].filter(Boolean).join('\n');

        appointment.notes = formattedNotes || appointment.notes;
        await appointment.save();

        const io = req.app.get('io');
        if (io) {
            const payload = appointment.toJSON();
            io.to(`user:${appointment.patientId}`).emit('appointment:status_change', payload);
            io.to(`user:${appointment.doctorId}`).emit('appointment:status_change', payload);
            io.to(`user:${appointment.patientId}`).emit('appointment:completed', payload);
        }

        // --- ASYNC DOWNSTREAM (Outbreak Mapping Heatmap + Automated Medication Reminders) ---
        (async () => {
            try {
                const { mapDiseaseCategory } = require('../services/triageService');
                const { runDetectionCycle } = require('../services/outbreakDetectionService');
                const { extractMedications } = require('../services/medicationExtractionService');
                const { DiseaseReport, MedicationReminder } = require('../models');
                const ngeohash = require('ngeohash');

                const textToSummarize = `${notes || ''} ${prescriptionText || ''} ${appointment.symptoms || ''}`.trim();
                const patient = appointment.patient;

                // 1. Outbreak Mapping for Epidemic Heatmap
                if (patient && patient.latitude && patient.longitude) {
                    const diseaseCategory = mapDiseaseCategory(finalDiagnosis || '', textToSummarize);
                    const gh = ngeohash.encode(patient.latitude, patient.longitude, 5);
                    const parsedSeverity = severityScore ? parseInt(severityScore, 10) : 2;
                    const sScore = isNaN(parsedSeverity) ? 2 : parsedSeverity;

                    await DiseaseReport.create({
                        patientId: patient.userId,
                        doctorId: appointment.doctorId,
                        diseaseCategory,
                        symptomTags: [textToSummarize.slice(0, 499)],
                        geohash: gh,
                        source: 'manual',
                        severityScore: sScore,
                        confidenceLevel: 'confirmed'
                    });
                    console.log('[completeAppointment] In-person clinic disease report recorded for heatmap');
                    runDetectionCycle().catch(err => console.error('[outbreakDetection] Background err:', err));
                }

                // 2. Automated Medication Extraction & Reminders
                if (prescriptionText?.trim()) {
                    try {
                        const meds = await extractMedications(prescriptionText);
                        if (meds.length > 0) {
                            const today = new Date().toISOString().slice(0, 10);
                            for (const m of meds) {
                                await MedicationReminder.create({
                                    patientId: appointment.patientId,
                                    medicineName: m.name,
                                    dosage: m.dosage,
                                    frequency: m.frequency,
                                    startDate: today,
                                    reminderTimes: ['09:00'],
                                    isActive: false,
                                    bullJobIds: []
                                });
                            }
                            console.log('[completeAppointment] Auto-extracted', meds.length, 'medications for clinic appointment', appointment.id);
                        }
                    } catch (medErr) {
                        console.error('[completeAppointment] Medication extraction error:', medErr.message);
                    }
                }
            } catch (bgErr) {
                console.error('[completeAppointment] Background task error:', bgErr);
            }
        })();

        return res.json({
            success: true,
            message: 'Appointment examination completed and clinical data saved successfully.',
            appointment
        });
    } catch (err) {
        console.error('[completeAppointment] error:', err);
        return res.status(500).json({ error: 'Failed to complete appointment' });
    }
}

module.exports = {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    completeAppointment,
};
