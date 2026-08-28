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
