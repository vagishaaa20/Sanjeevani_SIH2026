const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Audit trail for every WhatsApp message sent or received by the platform.
 * `wa_message_id` has a UNIQUE constraint — used for idempotent webhook dedup.
 */
const WhatsappLog = sequelize.define(
    'WhatsappLog',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        phone: {
            type: DataTypes.STRING(30),
            allowNull: false,
            comment: 'E.164 phone number of the patient, e.g. +919876543210',
        },
        direction: {
            type: DataTypes.ENUM('inbound', 'outbound'),
            allowNull: false,
        },
        messageType: {
            type: DataTypes.ENUM('text', 'template', 'location', 'interactive'),
            allowNull: false,
            field: 'message_type',
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Body text or template name, for quick human review',
        },
        waMessageId: {
            type: DataTypes.STRING(128),
            allowNull: true,
            unique: true,
            field: 'wa_message_id',
            comment: 'Meta-assigned message ID — used for dedup on webhook retries',
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'sent',
            comment: 'sent | delivered | read | failed',
        },
    },
    {
        tableName: 'whatsapp_logs',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
    }
);

module.exports = WhatsappLog;
