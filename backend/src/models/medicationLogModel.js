const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Tracks individual dose events for a medication reminder.
 * Unique constraint on (reminder_id, date, time) prevents duplicate log entries.
 * Status is set to 'taken' by patient action; a scheduler job can sweep and set 'missed'.
 */
const MedicationLog = sequelize.define(
    'MedicationLog',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        reminderId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'reminder_id',
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        time: {
            type: DataTypes.STRING(5),
            allowNull: false,
            comment: 'HH:MM 24-hour format',
        },
        status: {
            type: DataTypes.ENUM('taken', 'missed', 'upcoming'),
            allowNull: false,
            defaultValue: 'upcoming',
        },
        loggedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'logged_at',
        },
    },
    {
        tableName: 'medication_log',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['reminder_id', 'date', 'time'],
            },
        ],
    }
);

module.exports = MedicationLog;
