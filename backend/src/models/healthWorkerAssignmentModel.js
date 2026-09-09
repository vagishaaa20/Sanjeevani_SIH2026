const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HealthWorkerAssignment = sequelize.define('HealthWorkerAssignment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    healthWorkerId: { type: DataTypes.UUID, allowNull: false },
    patientId: { type: DataTypes.UUID, allowNull: false },
    assignedBy: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'INACTIVE'), allowNull: false, defaultValue: 'ACTIVE' },
    assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'health_worker_assignments', timestamps: true, indexes: [{ fields: ['healthWorkerId', 'status'] }, { fields: ['patientId', 'status'] }] });

module.exports = HealthWorkerAssignment;