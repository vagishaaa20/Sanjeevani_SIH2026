const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HealthWorkerReferral = sequelize.define('HealthWorkerReferral', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    referringHealthWorkerId: { type: DataTypes.UUID, allowNull: true },
    doctorId: { type: DataTypes.UUID, allowNull: true },
    fromClinicId: { type: DataTypes.UUID, allowNull: true },
    toClinicId: { type: DataTypes.UUID, allowNull: true },
    toDoctorId: { type: DataTypes.UUID, allowNull: true },
    specialization: { type: DataTypes.STRING(160), allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: false },
    priority: { type: DataTypes.ENUM('NORMAL', 'HIGH', 'URGENT'), allowNull: false, defaultValue: 'NORMAL' },
    status: { type: DataTypes.ENUM('PENDING', 'SENT', 'ACCEPTED', 'ATTENDED', 'OUTCOME_RECORDED', 'SCHEDULED', 'COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED'), allowNull: false, defaultValue: 'PENDING' },
    appointmentDate: { type: DataTypes.DATE, allowNull: true },
    outcome: { type: DataTypes.TEXT, allowNull: true },
    outcomeRecordedAt: { type: DataTypes.DATE, allowNull: true },
    attendedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    closedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'health_worker_referrals', timestamps: true, indexes: [{ fields: ['patientId', 'status'] }, { fields: ['status'] }] });

module.exports = HealthWorkerReferral;