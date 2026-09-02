const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ConsultationDocument = sequelize.define(
    'ConsultationDocument',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        consultationId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        fileUrl: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        documentType: {
            type: DataTypes.ENUM('lab_report', 'prescription', 'photo', 'other'),
            allowNull: false,
            defaultValue: 'other',
        },
        uploadedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'consultation_documents',
        timestamps: true,
    }
);

module.exports = ConsultationDocument;
