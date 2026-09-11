const { Op } = require('sequelize');
const { User, DoctorProfile } = require('../models');
const { ROLES, VERIFICATION_STATUS } = require('../config/roles');
const { findNearbyDoctors } = require('../services/locationService');

// ── GET /api/doctors/public ───────────────────────────────────────────────────

/**
 * Public doctor discovery endpoint — no authentication required.
 * Returns ONLY safe public fields. NMC numbers, documents, and
 * verification notes are NEVER included.
 *
 * Query params:
 *   ?city=Delhi
 *   ?specialization=Cardiologist
 *   ?page=1&limit=20
 */
async function listPublicDoctors(req, res) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const profileWhere = {
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
    };

    if (req.query.city) {
        profileWhere.city = { [Op.iLike]: `%${req.query.city}%` };
    }
    if (req.query.specialization) {
        profileWhere.specialization = { [Op.iLike]: `%${req.query.specialization}%` };
    }

    const { count, rows } = await DoctorProfile.findAndCountAll({
        where: profileWhere,
        // PUBLIC FIELDS ONLY — sensitive data explicitly excluded
        attributes: [
            'userId', 'fullName', 'specialization', 'subSpecialization',
            'city', 'consultationFee', 'languages', 'regionsServed',
            'clinicOrHospital', 'bio', 'availability', 'yearsOfExperience',
        ],
        limit,
        offset,
        order: [['fullName', 'ASC']],
    });

    return res.json({ total: count, page, limit, doctors: rows });
}

// ── GET /api/doctors/public/:userId ──────────────────────────────────────────

/**
 * Public profile of a single verified doctor.
 * Safe fields only — no NMC details, documents, or verification notes.
 */
async function getPublicDoctor(req, res) {
    const profile = await DoctorProfile.findOne({
        where: {
            userId: req.params.userId,
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
        },
        attributes: [
            'userId', 'fullName', 'specialization', 'subSpecialization',
            'city', 'consultationFee', 'languages', 'regionsServed',
            'clinicOrHospital', 'bio', 'availability', 'yearsOfExperience',
        ],
    });

    if (!profile) return res.status(404).json({ error: 'Doctor not found or not yet verified' });
    return res.json({ doctor: profile });
}

const getNearbyDoctors = async (req, res, next) => {
    try {
        const { lat, lng, radiusKm, specialization } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'lat and lng are required' });
        }
        const doctors = await findNearbyDoctors({
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radiusKm: radiusKm ? parseFloat(radiusKm) : 15,
            specialization: specialization || null
        });
        res.json({ count: doctors.length, doctors });
    } catch (err) {
        next(err);
    }
};

// ── Add this to doctorController.js ──────────────────────────────────────────

// Fields a doctor is allowed to self-update. Deliberately excludes
// verificationStatus, verifiedBy, verifiedAt, verificationNotes,
// medicalRegistrationNumber, and other credential/audit fields —
// those must only change through the verification workflow.
const SELF_UPDATABLE_FIELDS = [
    'fullName',
    'city',
    'specialization',
    'subSpecialization',
    'yearsOfExperience',
    'consultationFee',
    'languages',
    'regionsServed',
    'clinicOrHospital',
    'clinicId', // optional — set to null to unlink from a clinic
    'bio',
    'availability',
];

/**
 * PATCH /api/doctors/profile
 * Authenticated doctor updates their own profile.
 * Body: any subset of SELF_UPDATABLE_FIELDS.
 */
async function updateOwnProfile(req, res, next) {
    try {
        const profile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
        if (!profile) {
            return res.status(404).json({ error: 'Doctor profile not found' });
        }

        // If clinicId is being set (not cleared), verify the clinic exists and is verified
        if (req.body.clinicId) {
            const { ClinicProfile } = require('../models');
            const { VERIFICATION_STATUS } = require('../constants/roles');
            const clinic = await ClinicProfile.findOne({
                where: { userId: req.body.clinicId, verificationStatus: VERIFICATION_STATUS.VERIFIED },
            });
            if (!clinic) {
                return res.status(400).json({ error: 'clinicId does not match a verified clinic' });
            }
        }

        const updates = {};
        for (const field of SELF_UPDATABLE_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        await profile.update(updates);
        return res.json({ message: 'Profile updated', profile });
    } catch (err) {
        next(err);
    }
}

const getRecentPatients = async (req, res, next) => {
    try {
        const { Consultation, PatientProfile, User } = require('../models');
        const consultations = await Consultation.findAll({
            where: { doctorId: req.user.id },
            include: [
                {
                    model: User,
                    as: 'patient',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName'] }]
                }
            ],
            order: [['createdAt', 'DESC']],
        });

        const patientsMap = new Map();
        for (const c of consultations) {
            if (c.patient && !patientsMap.has(c.patientId)) {
                patientsMap.set(c.patientId, {
                    id: c.patient.id,
                    phone: c.patient.phone,
                    fullName: c.patient.patientProfile?.fullName || 'Unknown Patient'
                });
            }
        }

        return res.json({ patients: Array.from(patientsMap.values()) });
    } catch (err) {
        next(err);
    }
};

const getIncomingReferrals = async (req, res, next) => {
    try {
        const { HealthWorkerReferral, User, PatientProfile, HealthWorkerProfile, ClinicProfile, DoctorProfile } = require('../models');
        const referrals = await HealthWorkerReferral.findAll({
            where: { toDoctorId: req.user.id },
            include: [
                {
                    model: User,
                    as: 'patient',
                    attributes: ['id', 'phone'],
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'region'] }]
                },
                {
                    model: User,
                    as: 'referringHealthWorker',
                    attributes: ['id', 'phone'],
                    include: [{ model: HealthWorkerProfile, as: 'healthWorkerProfile', attributes: ['name'] }]
                },
                {
                    model: User,
                    as: 'fromClinic',
                    attributes: ['id'],
                    include: [{ model: ClinicProfile, as: 'clinicProfile', attributes: ['clinicName'] }]
                },
                {
                    model: User,
                    as: 'doctor',
                    attributes: ['id'],
                    include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: ['fullName'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.json({ count: referrals.length, referrals });
    } catch (err) {
        next(err);
    }
};

const updateIncomingReferral = async (req, res, next) => {
    try {
        const { HealthWorkerReferral } = require('../models');
        const { id } = req.params;
        const { status, outcome } = req.body;

        const referral = await HealthWorkerReferral.findOne({
            where: { id, toDoctorId: req.user.id }
        });

        if (!referral) {
            return res.status(404).json({ error: 'Referral not found or not assigned to you' });
        }

        const VALID_TRANSITIONS = {
            'SENT': ['ACCEPTED', 'REJECTED'],
            'ACCEPTED': ['ATTENDED'],
            'ATTENDED': ['OUTCOME_RECORDED'],
            'OUTCOME_RECORDED': ['CLOSED']
        };

        if (!VALID_TRANSITIONS[referral.status]?.includes(status)) {
            return res.status(400).json({ error: `Invalid transition from ${referral.status} to ${status}` });
        }

        const updates = { status };

        if (status === 'COMPLETED') {
            updates.completedAt = new Date();
        } else if (status === 'ATTENDED') {
            updates.attendedAt = new Date();
        } else if (status === 'OUTCOME_RECORDED') {
            if (!outcome || !String(outcome).trim()) return res.status(400).json({ error: 'Outcome text is required to record outcome' });
            updates.outcome = String(outcome).trim();
            updates.outcomeRecordedAt = new Date();
        } else if (status === 'CLOSED') {
            updates.closedAt = new Date();
        }

        await referral.update(updates);
        return res.json({ message: 'Referral updated successfully', referral });
    } catch (err) {
        next(err);
    }
};

const getDoctorStats = async (req, res, next) => {
    try {
        const { Consultation, HealthWorkerReferral, DoctorProfile } = require('../models');
        const doctorId = req.user.id;
        const profile = await DoctorProfile.findOne({ where: { userId: doctorId } });

        const totalConsultations = await Consultation.count({ where: { doctorId } }).catch(() => 0);
        const completedConsultations = await Consultation.count({ where: { doctorId, status: 'COMPLETED' } }).catch(() => 0);
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayConsultations = await Consultation.count({
            where: {
                doctorId,
                createdAt: { [Op.gte]: todayStart }
            }
        }).catch(() => 0);

        const recentConsultations = await Consultation.findAll({
            where: { doctorId },
            attributes: ['patientId']
        }).catch(() => []);
        const uniquePatients = new Set(recentConsultations.map(c => c.patientId)).size;

        const totalReferrals = await HealthWorkerReferral.count({ where: { toDoctorId: doctorId } }).catch(() => 0);
        const pendingReferrals = await HealthWorkerReferral.count({ where: { toDoctorId: doctorId, status: 'SENT' } }).catch(() => 0);

        return res.json({
            stats: {
                totalConsultations,
                completedConsultations,
                todayConsultations,
                uniquePatients,
                totalReferrals,
                pendingReferrals,
                avgRating: profile?.avgRating ? Number(profile.avgRating) : 5.0,
                reviewCount: profile?.reviewCount || 0,
                practiceLocationsCount: (profile?.availability?.practiceLocations || []).length
            },
            practiceLocations: profile?.availability?.practiceLocations || []
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listPublicDoctors,
    getPublicDoctor,
    getNearbyDoctors,
    updateOwnProfile,
    getRecentPatients,
    getIncomingReferrals,
    updateIncomingReferral,
    getDoctorStats,
};
