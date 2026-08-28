const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { VERIFICATION_STATUS } = require('../config/roles');

const DoctorProfile = sequelize.define(
  'DoctorProfile',
  {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    // ── Basic ─────────────────────────────────────────────────────────────────
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    // ── NMC professional information ──────────────────────────────────────────
    medicalRegistrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    stateMedicalCouncil: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    registrationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    primaryMedicalQualification: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'e.g. MBBS, BDS',
    },
    medicalCollege: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    graduationYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // ── Practice / professional profile ──────────────────────────────────────
    specialization: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    subSpecialization: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0 },
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    regionsServed: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    clinicOrHospital: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    /**
     * availability: { days: [], timeSlots: [] }
     * Stored as JSONB; exact structure is decided by the scheduling feature.
     */
    availability: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },

    // ── Verification ──────────────────────────────────────────────────────────
    verificationStatus: {
      type: DataTypes.ENUM(...Object.values(VERIFICATION_STATUS)),
      allowNull: false,
      defaultValue: VERIFICATION_STATUS.PENDING_VERIFICATION,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Admin userId who performed the verification action',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    // PostGIS geography column — auto-synced from latitude/longitude via beforeSave hook.
    // Callers set latitude/longitude; this column is maintained automatically.
    location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: true,
    },
  },

  {
    tableName: 'doctor_profiles',
    timestamps: true,
    hooks: {
      // Keep the geography column in sync with lat/lng — callers never touch 'location' directly.
      beforeSave: (profile) => {
        const latChanged = profile.changed('latitude');
        const lngChanged = profile.changed('longitude');
        if (latChanged || lngChanged) {
          const lat = parseFloat(profile.latitude);
          const lng = parseFloat(profile.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            // GeoJSON order: [longitude, latitude]
            profile.location = { type: 'Point', coordinates: [lng, lat] };
          } else {
            profile.location = null;
          }
        }
      },
    },
  }
);

module.exports = DoctorProfile;