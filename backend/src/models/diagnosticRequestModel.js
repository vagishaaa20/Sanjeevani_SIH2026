const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DiagnosticRequest = sequelize.define(
    'DiagnosticRequest',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        requesterId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        clinicId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        testName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'REQUESTED',
        },
        scheduledDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        priority: {
            type: DataTypes.ENUM('NORMAL', 'HIGH', 'URGENT'),
            allowNull: false,
            defaultValue: 'NORMAL',
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        resultDocumentUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: 'diagnostic_requests',
        timestamps: true,
    }
);

module.exports = DiagnosticRequest;
