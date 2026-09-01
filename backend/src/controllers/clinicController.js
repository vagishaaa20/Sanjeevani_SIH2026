const { ClinicProfile } = require('../models');
const { VERIFICATION_STATUS } = require('../constants/roles');
const { findNearbyClinics } = require('../services/locationService');

const getNearbyClinics = async (req, res, next) => {
    try {
        const { lat, lng, radiusKm, specialization } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'lat and lng are required' });
        }
        const clinics = await findNearbyClinics({
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radiusKm: radiusKm ? parseFloat(radiusKm) : 15,
            specialization: specialization || null
        });
        res.json({ count: clinics.length, clinics });
    } catch (err) {
        console.error('[getNearbyClinics ERROR]', err.message, err.original?.message);
        next(err);
    }
};
/**
 * Get all pending clinic audit applications.
 * GET /api/clinics/pending
 */
async function getPendingClinics(req, res) {
    try {
        const pendingClinics = await ClinicProfile.findAll({
            where: { verificationStatus: VERIFICATION_STATUS.PENDING_VERIFICATION }
        });
        return res.json({ clinics: pendingClinics });
    } catch (err) {
        console.error('Error fetching pending clinics:', err);
        return res.status(500).json({ error: 'Internal server error while retrieving clinics' });
    }
}

/**
 * Approve or Reject clinic registration.
 * PATCH /api/clinics/verify/:id
 * Body: { status: 'VERIFIED' | 'REJECTED' }
 */
async function verifyClinic(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (![VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED].includes(status)) {
        return res.status(400).json({ error: 'Invalid status action. Must be VERIFIED or REJECTED.' });
    }

    try {
        const clinic = await ClinicProfile.findOne({ where: { userId: id } });
        if (!clinic) {
            return res.status(404).json({ error: 'Clinic profile not found' });
        }

        clinic.verificationStatus = status;
        clinic.verifiedAt = new Date();
        if (req.user) clinic.verifiedBy = req.user.id;
        await clinic.save();

        return res.json({
            message: `Clinic verification status updated to ${status}`,
            clinic
        });
    } catch (err) {
        console.error('Error verifying clinic:', err);
        return res.status(500).json({ error: 'Internal server error during clinic verification' });
    }
}

// Redirect signup flow request
async function registerClinic(req, res) {
    // Call registerClinic directly since authController takes care of it
    return res.status(400).json({ error: 'Please use /api/auth/register/clinic for clinic registration' });
}

/**
 * GET /api/clinics
 * Lightweight public list of verified clinics — for populating dropdowns
 * (e.g. a doctor selecting their practice location). No auth required.
 *
 * Query params:
 *   ?city=Delhi     (optional filter)
 *   ?search=apollo  (optional name search)
 */
async function listClinics(req, res, next) {
    try {
        const { Op } = require('sequelize');
        const where = { verificationStatus: VERIFICATION_STATUS.VERIFIED };

        if (req.query.city) {
            where.city = { [Op.iLike]: `%${req.query.city}%` };
        }
        if (req.query.search) {
            where.clinicName = { [Op.iLike]: `%${req.query.search}%` };
        }

        const clinics = await ClinicProfile.findAll({
            where,
            attributes: ['userId', 'clinicName', 'city', 'address'],
            order: [['clinicName', 'ASC']],
            limit: 100,
        });

        return res.json({ count: clinics.length, clinics });
    } catch (err) {
        next(err);
    }
}

// Add `listClinics` to the module.exports object at the bottom of clinicController.js

module.exports = {
    getPendingClinics,
    verifyClinic,
    registerClinic,
    getNearbyClinics,
    listClinics
};
