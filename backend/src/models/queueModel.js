const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { QUEUE_STATUS } = require('../constants/queueStatus');

const Queue = sequelize.define('Queue', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    clinicId: { type: DataTypes.UUID, allowNull: true },
    doctorId: { type: DataTypes.UUID, allowNull: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    tokenNumber: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM(...Object.values(QUEUE_STATUS)), defaultValue: QUEUE_STATUS.WAITING },
    specialization: { type: DataTypes.STRING(150), allowNull: true },
    symptoms: { type: DataTypes.TEXT, allowNull: true },
    urgency: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'low' },
    temporaryDiagnosis: { type: DataTypes.TEXT, allowNull: true },
    acceptedDoctorIds: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    appointmentDate: { type: DataTypes.DATE, allowNull: true },
    estimatedTime: { type: DataTypes.STRING(100), allowNull: true },
    selectedDoctorId: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'queues', timestamps: true });

module.exports = Queue;
