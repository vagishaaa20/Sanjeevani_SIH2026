const { Op } = require('sequelize');
const { User, DoctorProfile } = require('../models');
const { ROLES, VERIFICATION_STATUS } = require('../config/roles');

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

module.exports = { listPublicDoctors, getPublicDoctor };
