const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { PATIENT_STATUS } = require('../config/roles');

const PatientProfile = sequelize.define(
  'PatientProfile',
  {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    // ── Basic registration fields ─────────────────────────────────────────────
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    sex: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: true,
    },
    preferredLanguage: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    // ── ABHA / ABDM linkage (all optional) ───────────────────────────────────
    abhaNumber: {
      type: DataTypes.STRING(14),
      allowNull: true,
      comment: '14-digit ABDM health identifier',
    },
    abhaLinked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    abhaConsentStatus: {
      type: DataTypes.ENUM('not_given', 'given', 'revoked'),
      allowNull: false,
      defaultValue: 'not_given',
    },

    // ── Health profile (filled after signup) ─────────────────────────────────
    medicalConditions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    allergies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    currentMedications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    pastMedicalHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    familyMedicalHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    /**
     * lifestyle: { smoking, alcohol, physicalActivity, sleep }
     * Stored as JSONB for flexibility.
     */
    lifestyle: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    /**
     * emergencyContact: { name, relationship, phone }
     */
    emergencyContact: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    // ── Account status ────────────────────────────────────────────────────────
    accountStatus: {
      type: DataTypes.ENUM(...Object.values(PATIENT_STATUS)),
      allowNull: false,
      defaultValue: PATIENT_STATUS.REGISTERED,
    },
  },
  {
    tableName: 'patient_profiles',
    timestamps: true,
  }
);

module.exports = PatientProfile;