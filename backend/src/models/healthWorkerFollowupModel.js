const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HealthWorkerFollowup = sequelize.define('HealthWorkerFollowup', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    healthWorkerId: { type: DataTypes.UUID, allowNull: false },
    followUpDate: { type: DataTypes.DATEONLY, allowNull: false },
    type: { type: DataTypes.ENUM('CALL', 'VISIT', 'WHATSAPP', 'OTHER'), allowNull: false, defaultValue: 'CALL' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('PENDING', 'COMPLETED', 'MISSED'), allowNull: false, defaultValue: 'PENDING' },
}, { tableName: 'health_worker_followups', timestamps: true, indexes: [{ fields: ['healthWorkerId', 'status', 'followUpDate'] }, { fields: ['patientId'] }] });

module.exports = HealthWorkerFollowup;