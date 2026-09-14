const { Op } = require('sequelize');
const { DoctorProfile } = require('../models');
const { VERIFICATION_STATUS } = require('../constants/roles');
const { findNearbyDoctors } = require('../services/locationService');

// ── Helper: Haversine distance calculator in km ──────────────────────────────
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const p1 = parseFloat(lat1);
    const q1 = parseFloat(lon1);
    const p2 = parseFloat(lat2);
    const q2 = parseFloat(lon2);
    if (isNaN(p1) || isNaN(q1) || isNaN(p2) || isNaN(q2)) return null;

    const R = 6371; // km
    const dLat = (p2 - p1) * Math.PI / 180;
    const dLon = (q2 - q1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(p1 * Math.PI / 180) * Math.cos(p2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

// ── GET /api/doctors/public ───────────────────────────────────────────────────

/**
 * Public doctor discovery endpoint — no authentication required.
 * Returns ONLY safe public fields. NMC numbers, documents, and
 * verification notes are NEVER included.
 *
 * Query params:
 *   ?city=Delhi
 *   ?specialization=Cardiologist
 *   ?lat=28.6139&lng=77.2090
 *   ?page=1&limit=50
 */
async function listPublicDoctors(req, res) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const offset = (page - 1) * limit;
    const patientLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const patientLng = req.query.lng ? parseFloat(req.query.lng) : null;

    const profileWhere = {
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        [Op.and]: [
            sequelize.literal(`("DoctorProfile"."availability"->>'isAccepting' IS NULL OR "DoctorProfile"."availability"->>'isAccepting' != 'false')`)
        ]
    };

    if (req.query.city) {
        profileWhere[Op.or] = [
            { city: { [Op.iLike]: `%${req.query.city}%` } },
            { address: { [Op.iLike]: `%${req.query.city}%` } },
            { state: { [Op.iLike]: `%${req.query.city}%` } },
            { clinicOrHospital: { [Op.iLike]: `%${req.query.city}%` } },
        ];
    }
    if (req.query.specialization && req.query.specialization !== 'All') {
        profileWhere.specialization = { [Op.iLike]: `%${req.query.specialization}%` };
    }

    const { count, rows } = await DoctorProfile.findAndCountAll({
        where: profileWhere,
        // PUBLIC FIELDS ONLY — sensitive data explicitly excluded
        attributes: [
            'userId', 'fullName', 'specialization', 'subSpecialization',
            'city', 'state', 'address', 'pincode', 'consultationFee', 'teleconsultationFee', 'languages', 'regionsServed',
            'clinicOrHospital', 'bio', 'availability', 'yearsOfExperience', 'practiceStartYear',
            'latitude', 'longitude', 'avgRating', 'reviewCount',
        ],
        limit,
        offset,
        order: [['fullName', 'ASC']],
    });

    const doctorsWithDistance = rows.map((r) => {
        const raw = r.toJSON();
        // Sync experience if practiceStartYear is set
        if (raw.practiceStartYear && (!raw.yearsOfExperience || raw.yearsOfExperience === 0)) {
            raw.yearsOfExperience = Math.max(0, new Date().getFullYear() - raw.practiceStartYear);
        }
        if (patientLat != null && patientLng != null && raw.latitude && raw.longitude) {
            raw.distanceKm = calculateDistanceKm(patientLat, patientLng, raw.latitude, raw.longitude);
        } else {
            raw.distanceKm = null;
        }
        return raw;
    });

    // Sort by distance if patient coords provided
    if (patientLat != null && patientLng != null) {
        doctorsWithDistance.sort((a, b) => {
            if (a.distanceKm == null) return 1;
            if (b.distanceKm == null) return -1;
            return a.distanceKm - b.distanceKm;
        });
    }

    return res.json({ total: count, page, limit, doctors: doctorsWithDistance });
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
            'city', 'state', 'address', 'pincode', 'consultationFee', 'teleconsultationFee', 'languages', 'regionsServed',
            'clinicOrHospital', 'bio', 'availability', 'yearsOfExperience', 'practiceStartYear',
            'latitude', 'longitude', 'avgRating', 'reviewCount',
        ],
    });

    if (!profile) return res.status(404).json({ error: 'Doctor not found or not yet verified' });
    const raw = profile.toJSON();
    if (raw.practiceStartYear && (!raw.yearsOfExperience || raw.yearsOfExperience === 0)) {
        raw.yearsOfExperience = Math.max(0, new Date().getFullYear() - raw.practiceStartYear);
    }
    return res.json({ doctor: raw });
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
            radiusKm: radiusKm ? parseFloat(radiusKm) : 30,
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
    'state',
    'address',
    'pincode',
    'latitude',
    'longitude',
    'specialization',
    'subSpecialization',
    'yearsOfExperience',
    'practiceStartYear',
    'consultationFee',
    'teleconsultationFee',
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

        // Auto-calculate & sync yearsOfExperience based on practiceStartYear
        const currentYear = new Date().getFullYear();
        if (updates.practiceStartYear != null && updates.practiceStartYear !== '') {
            const startYr = parseInt(updates.practiceStartYear, 10);
            if (!isNaN(startYr) && startYr > 1950 && startYr <= currentYear) {
                updates.practiceStartYear = startYr;
                if (updates.yearsOfExperience == null || updates.yearsOfExperience === '') {
                    updates.yearsOfExperience = Math.max(0, currentYear - startYr);
                }
            }
        } else if (updates.yearsOfExperience != null && updates.yearsOfExperience !== '') {
            const exp = parseInt(updates.yearsOfExperience, 10);
            if (!isNaN(exp) && exp >= 0) {
                updates.yearsOfExperience = exp;
                if (!updates.practiceStartYear) {
                    updates.practiceStartYear = Math.max(1950, currentYear - exp);
                }
            }
        }

        // If coordinates were updated, update location timestamp
        if (updates.latitude != null && updates.longitude != null) {
            updates.locationUpdatedAt = new Date();
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
