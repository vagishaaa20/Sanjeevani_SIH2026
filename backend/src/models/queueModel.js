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
}, { tableName: 'queues', timestamps: true });

module.exports = Queue;
