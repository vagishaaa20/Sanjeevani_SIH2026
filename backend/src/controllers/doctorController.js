const { Op, fn, col, literal } = require('sequelize');
const { User, DoctorProfile } = require('../models');
const { VERIFICATION_STATUS } = require('../config/roles');
const sequelize = require('../config/db');

// Enable PostGIS extension once on startup (no-op if already enabled)
sequelize.query("CREATE EXTENSION IF NOT EXISTS postgis").catch(() => {
  console.warn('[doctorController] PostGIS extension not available — falling back to Haversine formula.');
});

// ── GET /api/doctors ──────────────────────────────────────────────────────────

/**
 * Public doctor discovery endpoint — no authentication required.
 * Supports two search modes:
 *   1. Coordinate mode: ?lat=28.6&lng=77.2&radiusKm=15  → PostGIS ST_DWithin, sorted by distance
 *   2. City mode:       ?city=Delhi                      → iLike fallback
 *
 * Optional: ?specialization=Cardiologist  ?page=1  ?limit=20
 */
async function listPublicDoctors(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm) || 15;

  const profileWhere = {
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
  };

  const attributes = [
    'userId', 'fullName', 'specialization', 'subSpecialization',
    'city', 'consultationFee', 'languages', 'regionsServed',
    'clinicOrHospital', 'bio', 'availability', 'yearsOfExperience',
    'latitude', 'longitude',
  ];

  let order = [['fullName', 'ASC']];
  let usePostGIS = false;

  if (!isNaN(lat) && !isNaN(lng)) {
    // Try PostGIS path first; if extension unavailable, fall back to Haversine
    try {
      await sequelize.query("SELECT ST_MakePoint(0,0)");
      usePostGIS = true;
    } catch (_) {
      // PostGIS not available, handled below
    }
  }

  let postgisFailed = false;

  if (!isNaN(lat) && !isNaN(lng) && usePostGIS) {
    try {
      // ── PostGIS path ───────────────────────────────────────────────────────────
      // Use plain number interpolation — sequelize.escape() wraps in quotes which breaks ST_MakePoint
      const safeLat = Number(lat);
      const safeLng = Number(lng);
      const searchPoint = literal(`ST_SetSRID(ST_MakePoint(${safeLng}, ${safeLat}), 4326)::geography`);

      // Only consider doctors who have a location set
      profileWhere.location = { [Op.not]: null };

      attributes.push([
        fn('ST_Distance', col('DoctorProfile.location'), searchPoint),
        'distanceMeters',
      ]);

      profileWhere[Op.and] = sequelize.where(
        fn('ST_DWithin', col('DoctorProfile.location'), searchPoint, radiusKm * 1000),
        true
      );

      order = [[literal('"distanceMeters"'), 'ASC']];

      const { count, rows } = await DoctorProfile.findAndCountAll({
        where: profileWhere,
        attributes,
        limit,
        offset,
        order,
      });

      const doctors = rows.map(doc => {
        const d = doc.toJSON();
        const meters = doc.get('distanceMeters');
        if (meters !== undefined && meters !== null) {
          d.distanceKm = parseFloat((Number(meters) / 1000).toFixed(1));
        }
        delete d.distanceMeters;
        return d;
      });

      return res.json({ total: count, page, limit, doctors });

    } catch (postgisErr) {
      console.error('[doctorController] PostGIS query failed, falling back to Haversine:', postgisErr.message);
      postgisFailed = true;
    }
  }

  // Fallback to Haversine if PostGIS is not available or query execution failed
  if (!isNaN(lat) && !isNaN(lng) && (!usePostGIS || postgisFailed)) {
    // Reset attributes to count without distanceMeters
    const fallbackAttributes = attributes.filter(a => a !== 'location' && (!Array.isArray(a) || a[1] !== 'distanceMeters'));

    const haversine = `
      (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(${lat})) * cos(radians("DoctorProfile"."latitude")) *
          cos(radians("DoctorProfile"."longitude") - radians(${lng})) +
          sin(radians(${lat})) * sin(radians("DoctorProfile"."latitude"))
        ))
      ))
    `;

    fallbackAttributes.push([sequelize.literal(haversine), 'distanceKm']);

    const fallbackWhere = {
      ...profileWhere,
    };
    delete fallbackWhere.location;
    fallbackWhere[Op.and] = sequelize.where(sequelize.literal(haversine), '<=', radiusKm);

    const fallbackOrder = [[sequelize.literal(haversine), 'ASC']];

    const { count, rows } = await DoctorProfile.findAndCountAll({
      where: fallbackWhere,
      attributes: fallbackAttributes,
      limit,
      offset,
      order: fallbackOrder,
    });

    const doctors = rows.map(doc => {
      const d = doc.toJSON();
      const dist = doc.get('distanceKm');
      if (dist !== undefined && dist !== null) {
        d.distanceKm = parseFloat(Number(dist).toFixed(1));
      }
      return d;
    });

    return res.json({ total: count, page, limit, doctors });
  }

  if (isNaN(lat) || isNaN(lng)) {
    // ── City / text match fallback ────────────────────────────────────────────
    if (req.query.city) {
      profileWhere.city = { [Op.iLike]: `%${req.query.city}%` };
    }
  }

  if (req.query.specialization && req.query.specialization !== 'ALL') {
    profileWhere.specialization = { [Op.iLike]: `%${req.query.specialization}%` };
  }

  const { count, rows } = await DoctorProfile.findAndCountAll({
    where: profileWhere,
    attributes,
    limit,
    offset,
    order,
  });

  return res.json({ total: count, page, limit, doctors: rows.map(r => r.toJSON()) });
}

// ── GET /api/doctors/:userId ──────────────────────────────────────────────────

/**
 * Public profile of a single verified doctor.
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
