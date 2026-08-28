const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { VERIFICATION_STATUS, REVIEWER_CATEGORY } = require('../config/roles');

const ReviewerProfile = sequelize.define(
  'ReviewerProfile',
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

    // ── Professional category ─────────────────────────────────────────────────
    professionalCategory: {
      type: DataTypes.ENUM(...Object.values(REVIEWER_CATEGORY)),
      allowNull: true,
      comment: 'Determines clinical authority and required documents',
    },

    // ── Fields for REGISTERED_MEDICAL_PRACTITIONER ────────────────────────────
    medicalRegistrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    stateMedicalCouncil: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    registrationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    primaryQualification: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    medicalCollege: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    specialization: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    // ── Fields for POSTGRADUATE_RESIDENT ─────────────────────────────────────
    institution: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Hospital or institution for PG residents',
    },
    pgSpecialization: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    pgYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 6 },
    },
    supervisingInstitution: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    // ── Fields for MEDICAL_INTERN ─────────────────────────────────────────────
    internshipStart: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    internshipEnd: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // ── Reviewer scope ────────────────────────────────────────────────────────
    reviewLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'e.g. senior, junior — set by admin at verification',
    },
    supervisionRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Interns and PG residents require supervision for final decisions',
    },
    /**
     * allowedActions: ['review', 'correct', 'escalate', 'accept']
     * Admin configures this at verification time based on category.
     */
    allowedActions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    specialityScope: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      comment: 'Speciality areas this reviewer is scoped to',
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
  },
  {
    tableName: 'reviewer_profiles',
    timestamps: true,
  }
);

module.exports = ReviewerProfile;
