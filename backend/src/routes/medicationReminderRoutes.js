const express = require('express');
const router = express.Router();
const c = require('../controllers/medicationReminderController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All routes require patient authentication
const auth = [authenticate, requireRole('patient')];

// Extract medicines from a consultation's prescription + create unconfirmed reminders
router.post('/extract', ...auth, c.extractAndCreate);

// List all reminders for the patient
router.get('/me', ...auth, c.listReminders);

// Today's doses with taken/upcoming/missed status
router.get('/today', ...auth, c.getTodaysMeds);

// Edit a reminder (dosage, times, frequency) before activation
router.patch('/:id', ...auth, c.updateReminder);

// Activate a reminder → schedules BullMQ repeatable jobs
router.post('/:id/activate', ...auth, c.activateReminder);

// Deactivate a reminder → removes BullMQ jobs
router.post('/:id/deactivate', ...auth, c.deactivateReminder);

// Mark a dose as taken for today
router.post('/:id/taken', ...auth, c.markTaken);

module.exports = router;
