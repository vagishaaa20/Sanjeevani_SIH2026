const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TriageCorrection = sequelize.define(
    'TriageCorrection',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        requestId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'PatientRequest ID',
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        reviewerId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User ID of HITL Reviewer / Doctor who made the correction',
        },
        reviewerName: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        symptoms: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        duration: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        painLevel: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        affectedArea: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        attachments: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        originalAiCategory: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        originalSpecialist: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        originalReasoning: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        correctedCategory: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        correctedSpecialist: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        overrideReason: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Reason why the clinician changed the AI categorization',
        },
        fullDatasetEntry: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Complete prompt-response-correction payload ready for ML training pipeline',
        },
    },
    {
        tableName: 'triage_corrections',
        timestamps: true,
    }
);

module.exports = TriageCorrection;
