const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CONSULTATION_STATUS = Object.freeze({
    QUEUED: 'queued',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DISCONNECTED: 'disconnected',
});

const Consultation = sequelize.define(
    'Consultation',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        roomId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'WebRTC room ID',
        },
        webrtcStatus: {
            type: DataTypes.ENUM('scheduled', 'waiting', 'in_progress', 'completed', 'missed', 'disconnected'),
            allowNull: true,
            defaultValue: 'scheduled',
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Live plain text notes taken by doctor during the call',
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        doctorId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        clinicId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(CONSULTATION_STATUS)),
            allowNull: false,
            defaultValue: CONSULTATION_STATUS.QUEUED,
        },
        scheduledAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        prescriptionUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'URL to the generated prescription PDF, if available',
        },
        subsidyApplied: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        subsidyAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Amount subsidised for this consultation',
        },
        fullFee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: "Doctor's full consultation fee at time of booking",
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // WebRTC session info for rejoining in-progress calls
        roomId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // ── AI Health Summary ──────────────────────────────────────────────────
        aiSummary: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ai_summary',
            comment: 'Gemini-generated plain-language summary of doctor notes — cached',
        },
        aiSummaryGeneratedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'ai_summary_generated_at',
            comment: 'Timestamp of last summary generation — used to detect stale cache',
        },
        // ── Symptom Timeline ──────────────────────────────────────────────────
        reportedSymptoms: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'reported_symptoms',
            comment: 'Patient-reported symptoms at time of booking',
        },
        // ── Medication Extraction ─────────────────────────────────────────────
        prescriptionText: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'prescription_text',
            comment: 'Raw prescription text used for medication auto-extraction',
        },
    },
    {
        tableName: 'consultations',
        timestamps: true,
    }
);

module.exports = { Consultation, CONSULTATION_STATUS };
