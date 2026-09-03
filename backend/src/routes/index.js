const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const patientRoutes = require('./patientRoutes');
const doctorRoutes = require('./doctorRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const queueRoutes = require('./queueRoutes');
const encounterRoutes = require('./encounterRoutes');
const clinicRoutes = require('./clinicRoutes');
const facilityRoutes = require('./facilityRoutes');
const transportRoutes = require('./transportRoutes');
const profileRoutes = require('./profileRoutes');
const adminRoutes = require('./adminRoutes');
const documentRoutes = require('./documentRoutes');
const consultationRoutes = require('./consultationRoutes');
const subsidyRoutes = require('./subsidyRoutes');
const whatsappRoutes = require('./whatsappRoutes');
const medicationReminderRoutes = require('./medicationReminderRoutes');
const outbreakRoutes = require('./outbreakRoutes');
const triageRoutes = require('./triageRoutes');
const translateRoutes = require('./translateRoutes');
const doctorQueueRoutes = require('./doctorQueueRoutes');
const consultationDocumentRoutes = require('./consultationDocumentRoutes');
const medicineInventoryRoutes = require('./medicineInventoryRoutes');
const medicineRoutes = require('./medicineRoutes');

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);

// More specific doctor routes must go before generic /doctors
router.use('/doctors/queue', doctorQueueRoutes);
router.use('/doctors', doctorRoutes);

router.use('/clinics', clinicRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/queues', queueRoutes);
router.use('/encounters', encounterRoutes);
router.use('/facilities', facilityRoutes);
router.use('/transports', transportRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/documents', documentRoutes);
router.use('/consultations', consultationRoutes);
router.use('/subsidy', subsidyRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/medication-reminders', medicationReminderRoutes);
router.use('/outbreaks', outbreakRoutes);
router.use('/triage', triageRoutes);
router.use('/translate', translateRoutes);
router.use('/consultations', consultationDocumentRoutes);
router.use('/medicine-inventory', medicineInventoryRoutes);
router.use('/medicines', medicineRoutes);

module.exports = router;