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

// Add `updateOwnProfile` to the module.exports object at the bottom of doctorController.js

module.exports = { listPublicDoctors, getPublicDoctor , getNearbyDoctors , updateOwnProfile };
