const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HealthWorkerProfile = sequelize.define('HealthWorkerProfile', {
    userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    area: { type: DataTypes.STRING(160), allowNull: true },
    district: { type: DataTypes.STRING(160), allowNull: true },
    village: { type: DataTypes.STRING(160), allowNull: true },
    workerType: { type: DataTypes.ENUM('ASHA', 'ANM', 'COMMUNITY_WORKER', 'OTHER'), allowNull: false, defaultValue: 'COMMUNITY_WORKER' },
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'health_worker_profiles', timestamps: true });

module.exports = HealthWorkerProfile;