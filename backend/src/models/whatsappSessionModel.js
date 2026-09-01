const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Per-phone conversational state for the WhatsApp bot.
 * Primary key is the patient's phone number (E.164).
 * `context` (JSONB) stores step-specific data such as nearby doctor list.
 */
const WhatsappSession = sequelize.define(
    'WhatsappSession',
    {
        phone: {
            type: DataTypes.STRING(30),
            primaryKey: true,
            comment: 'E.164 phone number — unique per patient',
        },
        currentStep: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'idle',
            field: 'current_step',
            comment: 'idle | awaiting_action | awaiting_symptoms | awaiting_doctor_selection',
        },
        context: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
            comment: 'Step-specific context: nearby doctors list, pending action, saved location, etc.',
        },
    },
    {
        tableName: 'whatsapp_sessions',
        timestamps: true,
        createdAt: false,
        updatedAt: 'updated_at',
    }
);

module.exports = WhatsappSession;
