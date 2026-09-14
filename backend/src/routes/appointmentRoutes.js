const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    completeAppointment,
} = require('../controllers/appointmentController');

// Patient creates an in-person clinic appointment
router.post('/', authenticate, requireRole('patient'), bookAppointment);

// Patient retrieves their appointments
router.get('/my', authenticate, requireRole('patient'), getMyAppointments);

// Doctor retrieves their scheduled in-person clinic appointments
router.get('/doctor', authenticate, requireRole('doctor'), getDoctorAppointments);

// Update status (e.g. check-in, completed, cancelled)
router.patch('/:id/status', authenticate, updateAppointmentStatus);

// Officially complete clinic examination with diagnosis, prescription, reminders, and outbreak severity
router.post('/:id/complete', authenticate, requireRole('doctor'), completeAppointment);

module.exports = router;
