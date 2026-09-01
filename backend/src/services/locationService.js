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
 * Returns VERIFIED doctors whose linked clinic is within `radiusKm` km of (lat, lng).
 * Distance is measured from the clinic's location, not the doctor's own GPS.
 *
 * Doctors NOT linked to a clinic (clinic_id IS NULL) are excluded — only clinic-
 * affiliated verified doctors are recommended to patients.
 *
 * Result includes the clinic name and distance so the UI can group by clinic.
 */
async function findNearbyDoctors({ lat, lng, radiusKm = 15, specialization = null, limit = 30 }) {
  const dist = haversineExpr('c.latitude', 'c.longitude');
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
      d."clinicOrHospital",
      d.bio,
      d."clinic_id"  AS "clinicId",
      c."clinicName",
      c.address      AS "clinicAddress",
      c.city         AS "clinicCity",
      c.latitude     AS "clinicLatitude",
      c.longitude    AS "clinicLongitude",
      ${dist}        AS "distanceKm"
    FROM doctor_profiles d
    INNER JOIN clinic_profiles c ON c."userId" = d."clinic_id"
    WHERE d."verificationStatus" = 'VERIFIED'
      AND c."verificationStatus" = 'VERIFIED'
      AND c.latitude  IS NOT NULL
      AND c.longitude IS NOT NULL
      AND (${dist}) <= :radiusKm
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
