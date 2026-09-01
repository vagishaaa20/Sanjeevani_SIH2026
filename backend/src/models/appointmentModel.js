const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('Appointment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    doctorId: { type: DataTypes.UUID, allowNull: false },
    clinicId: { type: DataTypes.UUID, allowNull: true },
    appointmentDate: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.STRING(50), defaultValue: 'scheduled' },
}, { tableName: 'appointments', timestamps: true });

module.exports = Appointment;
