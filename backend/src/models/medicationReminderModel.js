const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FREQUENCY = Object.freeze({
    ONCE_DAILY: 'once_daily',
    TWICE_DAILY: 'twice_daily',
    THREE_TIMES_DAILY: 'three_times_daily',
    FOUR_TIMES_DAILY: 'four_times_daily',
    AS_NEEDED: 'as_needed',
});

/**
 * Tracks medication reminders extracted from a consultation prescription.
 * Reminders stay inactive (isActive=false) until the patient explicitly confirms them.
 * BullMQ repeatable job IDs are stored in bullJobIds for later removal on deactivation.
 */
const MedicationReminder = sequelize.define(
    'MedicationReminder',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'patient_id',
        },
        consultationId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'consultation_id',
        },
        medicineName: {
            type: DataTypes.STRING(200),
            allowNull: false,
            field: 'medicine_name',
        },
        dosage: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        frequency: {
            type: DataTypes.ENUM(...Object.values(FREQUENCY)),
            allowNull: false,
            defaultValue: FREQUENCY.ONCE_DAILY,
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'start_date',
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'end_date',
        },
        reminderTimes: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: ['09:00'],
            field: 'reminder_times',
            comment: 'Array of HH:MM strings, e.g. ["09:00", "21:00"]',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_active',
        },
        bullJobIds: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
            field: 'bull_job_ids',
            comment: 'BullMQ repeatable job IDs — used to remove jobs on deactivation',
        },
        extractedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'extracted_at',
        },
        confirmedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'confirmed_at',
        },
    },
    {
        tableName: 'medication_reminders',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

module.exports = { MedicationReminder, FREQUENCY };
