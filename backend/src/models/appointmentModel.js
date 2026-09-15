const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('Appointment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    doctorId: { type: DataTypes.UUID, allowNull: false },
    clinicId: { type: DataTypes.UUID, allowNull: true },
    appointmentDate: { type: DataTypes.DATE, allowNull: false },
    timeSlot: { type: DataTypes.STRING(100), allowNull: true },
    type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'clinic_visit' }, // 'clinic_visit' | 'teleconsultation'
    status: { type: DataTypes.STRING(50), defaultValue: 'scheduled' }, // 'scheduled' | 'checked_in' | 'completed' | 'cancelled'
    symptoms: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    tokenNumber: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'appointments', timestamps: true });

module.exports = Appointment;

