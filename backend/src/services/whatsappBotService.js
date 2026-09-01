/**
 * WhatsApp conversational bot — state machine.
 *
 * Entry point: handleInbound(phone, messageType, messageBody, locationPayload)
 *
 * State transitions are persisted in `whatsapp_sessions`.
 * All replies go through enqueueFreeText (FREE-FORM, 24-h window only).
 *
 * WHATSAPP_BOT_ENABLED env var: set to 'false' to disable bot without redeploy.
 */

const WhatsappSession = require('../models/whatsappSessionModel');
const { User, PatientProfile, Queue, DoctorProfile } = require('../models');
const { findNearbyDoctors } = require('./locationService');
const { runTriage } = require('./triageService');
const { enqueueFreeText } = require('./waCloudService');
const { QUEUE_STATUS } = require('../constants/queueStatus');

const BOT_ENABLED = process.env.WHATSAPP_BOT_ENABLED !== 'false';

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(phone, msg, data = {}) {
    const maskedPhone = phone.slice(0, 4) + '****' + phone.slice(-3);
    console.log(JSON.stringify({ ts: new Date().toISOString(), phone: maskedPhone, msg, ...data }));
}

/**
 * Upserts a WhatsappSession row and returns the full instance.
 */
async function getOrCreateSession(phone) {
    const [session] = await WhatsappSession.upsert(
        { phone, currentStep: 'idle', context: {} },
        { fields: [], returning: true }
    );
    // Re-fetch because upsert may not return the existing row updated_at reliably
    return WhatsappSession.findByPk(phone);
}

async function saveSession(session, step, context = null) {
    session.currentStep = step;
    if (context !== null) session.context = context;
    await session.save();
}

/**
 * Verify that the inbound phone number belongs to a registered patient.
 * Phone is stored in E.164 format in the users table (with leading +).
 */
async function findPatient(phone) {
    const normalized = phone.startsWith('+') ? phone : `+${phone}`;
    const user = await User.findOne({ where: { phone: normalized, role: 'patient' } });
    if (!user) return null;
    const profile = await PatientProfile.findOne({ where: { userId: user.id } });
    return profile ? { user, profile } : null;
}

// ── Menu text ─────────────────────────────────────────────────────────────────

const MENU_TEXT = `Welcome to *Sanjeevani* 🏥

Reply with a number:
1️⃣  Find nearby doctors
2️⃣  Book an appointment
3️⃣  AI symptom check
4️⃣  My upcoming appointments

Reply *MENU* at any time to return here.`;

// ── Step handlers ─────────────────────────────────────────────────────────────

async function handleIdle(phone, session, text) {
    await saveSession(session, 'awaiting_action', {});
    await enqueueFreeText(phone, MENU_TEXT);
    log(phone, 'state:idle→awaiting_action');
}

async function handleAwaitingAction(phone, session, text, location, patient) {
    const input = text.trim().toUpperCase();

    if (input === 'MENU') {
        await saveSession(session, 'awaiting_action', {});
        await enqueueFreeText(phone, MENU_TEXT);
        return;
    }

    if (input === '1' || input === '2') {
        // Doctor discovery — use saved location from context, or ask for pincode
        const savedLat = session.context?.lat;
        const savedLng = session.context?.lng;

        if (savedLat && savedLng) {
            await discoverDoctors(phone, session, savedLat, savedLng, input === '2');
        } else if (location) {
            await discoverDoctors(phone, session, location.latitude, location.longitude, input === '2');
        } else {
            await saveSession(session, 'awaiting_location', { intent: input });
            await enqueueFreeText(
                phone,
                '📍 Please share your WhatsApp location (tap the 📎 icon → Location) or reply with your 6-digit pincode.'
            );
        }
        return;
    }

    if (input === '3') {
        await saveSession(session, 'awaiting_symptoms', {});
        await enqueueFreeText(phone, '🔍 Please describe your symptoms in detail.\n\nExample: _Fever since 2 days, severe headache, body aches_');
        log(phone, 'state:awaiting_action→awaiting_symptoms');
        return;
    }

    if (input === '4') {
        await showUpcomingAppointments(phone, patient);
        await saveSession(session, 'idle');
        return;
    }

    await enqueueFreeText(phone, "Sorry, I didn't understand that. Reply *MENU* to see options.");
}

async function discoverDoctors(phone, session, lat, lng, isBookingIntent) {
    const doctors = await findNearbyDoctors({ lat, lng, radiusKm: 15, limit: 5 });

    if (!doctors.length) {
        await saveSession(session, 'idle');
        await enqueueFreeText(phone, '😔 No verified doctors found within 15 km. Try expanding your search or visiting *sanjeevani.health* for more options.');
        return;
    }

    const listText = doctors
        .map((d, i) =>
            `${i + 1}. *${d.fullName}* — ${d.specialization || 'General'}\n   📍 ${d.clinicName || d.clinicOrHospital || 'Clinic'}, ${d.clinicCity || ''} (${Number(d.distanceKm).toFixed(1)} km)\n   💰 ₹${d.consultationFee || '—'}`
        )
        .join('\n\n');

    const suffix = isBookingIntent
        ? '\n\nReply with the *number* to book an appointment, or *MENU* to go back.'
        : '\n\nReply *MENU* to go back.';

    await saveSession(session, isBookingIntent ? 'awaiting_doctor_selection' : 'idle', {
        lat,
        lng,
        nearbyDoctors: doctors.map((d) => ({ id: d.userId, name: d.fullName })),
    });

    await enqueueFreeText(phone, `🏥 *Nearby Doctors*\n\n${listText}${suffix}`);
    log(phone, 'doctors:found', { count: doctors.length });
}

async function handleAwaitingLocation(phone, session, text, location) {
    const intent = session.context?.intent || '1';
    let lat, lng;

    if (location) {
        lat = location.latitude;
        lng = location.longitude;
    } else {
        // Try pincode fallback (approximate center coordinates via known pincode map)
        // For now, prompt again — precise geocoding requires an external API
        await enqueueFreeText(phone, '😕 I can only use a shared WhatsApp location right now. Please tap the 📎 icon → Location to share your current position.');
        return;
    }

    await discoverDoctors(phone, session, lat, lng, intent === '2');
}

async function handleAwaitingDoctorSelection(phone, session, text, patient) {
    const input = text.trim();
    if (input.toUpperCase() === 'MENU') {
        await saveSession(session, 'idle');
        await enqueueFreeText(phone, MENU_TEXT);
        return;
    }

    const idx = parseInt(input, 10) - 1;
    const doctors = session.context?.nearbyDoctors || [];

    if (isNaN(idx) || idx < 0 || idx >= doctors.length) {
        await enqueueFreeText(phone, `Please reply with a number between 1 and ${doctors.length}, or *MENU* to go back.`);
        return;
    }

    const chosen = doctors[idx];

    try {
        const doctorProfile = await DoctorProfile.findOne({ where: { userId: chosen.id } });
        if (!doctorProfile) throw new Error('Doctor not found');

        // Reuse the same booking logic as queueController.requestConsultation
        const existing = await Queue.findOne({
            where: { patientId: patient.user.id, doctorId: chosen.id, status: QUEUE_STATUS.WAITING },
        });
        if (existing) {
            await enqueueFreeText(phone, `⚠️ You already have an active queue entry with *${chosen.name}*. Reply *MENU* to see other options.`);
            await saveSession(session, 'idle');
            return;
        }

        const queueCount = await Queue.count({ where: { doctorId: chosen.id, status: QUEUE_STATUS.WAITING } });
        await Queue.create({
            patientId: patient.user.id,
            doctorId: chosen.id,
            clinicId: doctorProfile.clinicId || null,
            tokenNumber: queueCount + 1,
            status: QUEUE_STATUS.WAITING,
        });

        await saveSession(session, 'idle', {});
        await enqueueFreeText(
            phone,
            `✅ *Appointment Requested!*\n\nYou are in the queue for *${chosen.name}* (Token #${queueCount + 1}).\n\nYou will be notified when it's your turn. Reply *MENU* for more options.`
        );
        log(phone, 'booking:success', { doctorId: chosen.id });
    } catch (err) {
        console.error('[whatsappBot] booking error:', err.message);
        await enqueueFreeText(phone, '❌ Booking failed. Please try again later or visit *sanjeevani.health* to book online.');
        await saveSession(session, 'idle');
    }
}

async function handleAwaitingSymptoms(phone, session, text) {
    if (!text.trim()) {
        await enqueueFreeText(phone, 'Please describe your symptoms so I can help you.');
        return;
    }

    await enqueueFreeText(phone, '⏳ Analysing your symptoms with AI…');

    try {
        const { recommendation, reason } = await runTriage({ symptoms: text });

        const labels = {
            emergency: '🚨 *Emergency — Seek Immediate Care*',
            teleconsultation: '📞 *Teleconsultation Recommended*',
            doctor_visit: '🏥 *Doctor Visit Recommended*',
        };

        const replyText =
            `${labels[recommendation] || recommendation}\n\n` +
            `_${reason}_\n\n` +
            `Reply *BOOK* to find a nearby doctor, or *MENU* to go back.\n\n` +
            `⚠️ _This is not a medical diagnosis. Always consult a qualified healthcare provider._`;

        await saveSession(session, 'idle', {});
        await enqueueFreeText(phone, replyText);
        log(phone, 'triage:done', { recommendation });
    } catch (err) {
        console.error('[whatsappBot] triage error:', err.message);
        await saveSession(session, 'idle');
        await enqueueFreeText(phone, '❌ AI triage is temporarily unavailable. Please visit *sanjeevani.health* or consult a doctor directly.');
    }
}

async function showUpcomingAppointments(phone, patient) {
    const { Queue: QueueModel } = require('../models');
    const entries = await QueueModel.findAll({
        where: { patientId: patient.user.id, status: QUEUE_STATUS.WAITING },
        include: [{ model: DoctorProfile, as: 'doctor', attributes: ['fullName', 'specialization'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
    });

    if (!entries.length) {
        await enqueueFreeText(phone, '📋 You have no upcoming appointments. Reply *2* to book one.');
        return;
    }

    const list = entries
        .map((e, i) => `${i + 1}. *${e.doctor?.fullName || 'Doctor'}* — Token #${e.tokenNumber}`)
        .join('\n');

    await enqueueFreeText(phone, `📋 *Your Queue Entries*\n\n${list}\n\nReply *MENU* for more options.`);
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Processes one inbound WhatsApp message and advances the conversation state.
 *
 * @param {string} phone          E.164 phone (without leading +), e.g. "919876543210"
 * @param {string} messageType    'text' | 'location'
 * @param {string} [messageBody]  Text body (for messageType === 'text')
 * @param {object} [location]     { latitude, longitude } (for messageType === 'location')
 */
async function handleInbound(phone, messageType, messageBody = '', location = null) {
    if (!BOT_ENABLED) {
        log(phone, 'bot:disabled — WHATSAPP_BOT_ENABLED=false');
        return;
    }

    log(phone, 'inbound', { messageType, step: '?' });

    // Check registration
    const patient = await findPatient(phone);
    if (!patient) {
        await enqueueFreeText(
            phone,
            '👋 Hi! To use Sanjeevani WhatsApp services, please register at *sanjeevani.health* first.\n\nOnce registered, come back and say hello!'
        );
        return;
    }

    const session = await getOrCreateSession(phone);
    const step = session.currentStep;
    const text = messageBody || '';

    log(phone, 'bot:step', { step });

    // Global escape hatch — BOOK keyword from triage result
    if (text.trim().toUpperCase() === 'BOOK') {
        const savedLat = session.context?.lat;
        const savedLng = session.context?.lng;
        if (savedLat && savedLng) {
            await discoverDoctors(phone, session, savedLat, savedLng, true);
        } else {
            await saveSession(session, 'awaiting_location', { intent: '2' });
            await enqueueFreeText(phone, '📍 Please share your WhatsApp location to find nearby doctors.');
        }
        return;
    }

    switch (step) {
        case 'idle':
            await handleIdle(phone, session, text);
            break;
        case 'awaiting_action':
            await handleAwaitingAction(phone, session, text, location, patient);
            break;
        case 'awaiting_location':
            await handleAwaitingLocation(phone, session, text, location);
            break;
        case 'awaiting_doctor_selection':
            await handleAwaitingDoctorSelection(phone, session, text, patient);
            break;
        case 'awaiting_symptoms':
            await handleAwaitingSymptoms(phone, session, text);
            break;
        default:
            await saveSession(session, 'idle');
            await enqueueFreeText(phone, "Sorry, I didn't understand that. Reply *MENU* to see options.");
    }
}

module.exports = { handleInbound };
