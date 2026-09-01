const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { VERIFICATION_STATUS } = require('../constants/roles');

const ClinicProfile = sequelize.define(
    'ClinicProfile',
    {
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            comment: 'Owner/Admin user ID representing the CLINIC_ADMIN user',
        },
        clinicName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        licenseNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        city: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
        },
        departments: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
            comment: 'Active services/departments e.g. ["OPD", "Diagnostics", "Lab"]',
        },
        verificationStatus: {
            type: DataTypes.ENUM(...Object.values(VERIFICATION_STATUS)),
            allowNull: false,
            defaultValue: VERIFICATION_STATUS.PENDING_VERIFICATION,
        },
        verifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'clinic_profiles',
        timestamps: true,
    }
);

module.exports = ClinicProfile;
