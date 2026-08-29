const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PatientRequest = sequelize.define(
    'PatientRequest',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User ID of the patient who submitted the request',
        },
        symptoms: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING(250),
            allowNull: false,
        },
        requirement: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        triageCategory: {
            type: DataTypes.ENUM('TELECONSULTATION', 'PHYSICAL_VISIT', 'EMERGENCY_ESCALATION'),
            allowNull: false,
        },
        triageReasoning: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        doctorId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'User ID of the doctor who accepted the request',
        },
        prescription: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Digital prescription issued by the doctor',
        },
        duration: {
            type: DataTypes.STRING(120),
            allowNull: true,
            comment: 'Duration of symptoms (e.g. 2 days, 1 week)',
        },
        painLevel: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Pain or severity scale 1 to 10',
        },
        affectedArea: {
            type: DataTypes.STRING(120),
            allowNull: true,
            comment: 'Body region affected (e.g. skin, throat, eye)',
        },
        attachments: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
            comment: 'Array of uploaded file objects [{ url, filename, type }]',
        },
        triageAnalysis: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Full structured AI clinical analysis',
        },
        originalAiAnalysis: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Original raw AI output before any HITL override',
        },
        hitlStatus: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'OVERRIDDEN', 'TIMEOUT_FALLBACK'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        hitlReviewerId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        hitlReviewerName: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        hitlReviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        hitlOverrideNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reviewer clinical notes / justification for confirmation or override',
        },
        isHitlOverridden: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        hitlTimerExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '15-minute countdown expiry for reviewer triage',
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
        },
    },
    {
        tableName: 'patient_requests',
        timestamps: true,
    }
);

module.exports = PatientRequest;
