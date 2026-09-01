const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { PATIENT_STATUS } = require('../constants/roles');

const PatientProfile = sequelize.define(
    'PatientProfile',
    {
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
        },
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
        abhaNumber: {
            type: DataTypes.STRING(14),
            allowNull: true,
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
        lifestyle: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        emergencyContact: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            comment: 'Last known GPS latitude (auto-updated on login)',
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            comment: 'Last known GPS longitude (auto-updated on login)',
        },
        locationUpdatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
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
