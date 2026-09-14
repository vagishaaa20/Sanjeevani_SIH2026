const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula fragment. References table alias + column via params.
 * `latCol` / `lngCol` are raw SQL column expressions (trusted — not user input).
 */
function haversineExpr(latCol, lngCol) {
  return `
    (${EARTH_RADIUS_KM} * acos(
      LEAST(1.0,
        cos(radians(:lat)) * cos(radians(${latCol})) *
        cos(radians(${lngCol}) - radians(:lng)) +
        sin(radians(:lat)) * sin(radians(${latCol}))
      )
    ))`;
}

// ── findNearbyClinics ─────────────────────────────────────────────────────────

/**
 * Returns verified clinics within `radiusKm` km of (lat, lng).
 * Joins doctor_profiles on clinic_id to aggregate specializations.
 *
 * Distance is calculated from the clinic's own latitude/longitude.
 */
async function findNearbyClinics({ lat, lng, radiusKm = 15, specialization = null, limit = 20 }) {
  const dist = haversineExpr('c.latitude', 'c.longitude');
  const specializationFilter = specialization
    ? `AND bool_or(d.specialization = :specialization)`
    : '';

  const query = `
    SELECT
      c."userId",
      c."clinicName",
      c.address,
      c.city,
      c.departments,
      c.latitude,
      c.longitude,
      ${dist} AS "distanceKm",
      count(d."userId") FILTER (WHERE d."verificationStatus" = 'VERIFIED') AS "doctorCount",
      array_agg(DISTINCT d.specialization) FILTER (WHERE d.specialization IS NOT NULL) AS specializations
    FROM clinic_profiles c
    LEFT JOIN doctor_profiles d ON d."clinic_id" = c."userId"
    WHERE c.latitude  IS NOT NULL
      AND c.longitude IS NOT NULL
      AND c."verificationStatus" = 'VERIFIED'
    GROUP BY c."userId"
    HAVING ${dist} <= :radiusKm
      ${specializationFilter}
    ORDER BY "distanceKm" ASC
    LIMIT :limit;
  `;

  return sequelize.query(query, {
    replacements: { lat, lng, radiusKm, specialization: specialization || null, limit },
    type: QueryTypes.SELECT,
  });
}

// ── findNearbyDoctors ─────────────────────────────────────────────────────────

/**
 * Returns VERIFIED doctors whose practice location (or linked clinic) is within `radiusKm` km of (lat, lng).
 * Distance is measured from the doctor's practice coordinates or clinic coordinates.
 */
async function findNearbyDoctors({ lat, lng, radiusKm = 25, specialization = null, limit = 50 }) {
  const effectiveLat = 'COALESCE(d.latitude, c.latitude)';
  const effectiveLng = 'COALESCE(d.longitude, c.longitude)';
  const dist = haversineExpr(effectiveLat, effectiveLng);
  const specializationFilter = specialization
    ? `AND d.specialization ILIKE :specialization`
    : '';

  const query = `
    SELECT
      d."userId",
      d."fullName",
      d.specialization,
      d."subSpecialization",
      d."consultationFee",
      d."yearsOfExperience",
      d."practiceStartYear",
      d."clinicOrHospital",
      d.address AS "doctorAddress",
      d.city AS "doctorCity",
      d.state AS "doctorState",
      d.pincode AS "doctorPincode",
      d.latitude AS "doctorLatitude",
      d.longitude AS "doctorLongitude",
      d.bio,
      d.availability,
      d."avgRating",
      d."reviewCount",
      d."clinic_id" AS "clinicId",
      COALESCE(c."clinicName", d."clinicOrHospital", 'Independent Medical Practice') AS "clinicName",
      COALESCE(c.address, d.address, d.city, 'Local Clinic') AS "clinicAddress",
      COALESCE(c.city, d.city, 'India') AS "clinicCity",
      COALESCE(c.latitude, d.latitude) AS "latitude",
      COALESCE(c.longitude, d.longitude) AS "longitude",
      ${dist} AS "distanceKm"
    FROM doctor_profiles d
    LEFT JOIN clinic_profiles c ON c."userId" = d."clinic_id"
    WHERE d."verificationStatus" = 'VERIFIED'
      AND (${effectiveLat} IS NOT NULL AND ${effectiveLng} IS NOT NULL)
      AND (${dist}) <= :radiusKm
      AND (d.availability->>'isAccepting' IS NULL OR d.availability->>'isAccepting' != 'false')
      ${specializationFilter}
    ORDER BY "distanceKm" ASC, d."fullName" ASC
    LIMIT :limit;
  `;

  return sequelize.query(query, {
    replacements: { lat, lng, radiusKm, specialization: specialization ? `%${specialization}%` : null, limit },
    type: QueryTypes.SELECT,
  });
}

module.exports = { findNearbyClinics, findNearbyDoctors };
