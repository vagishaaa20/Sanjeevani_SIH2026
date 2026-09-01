const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Encounter = sequelize.define('Encounter', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    doctorId: { type: DataTypes.UUID, allowNull: false },
    vitals: { type: DataTypes.JSONB, allowNull: true },
    prescription: { type: DataTypes.JSONB, allowNull: true },
}, { tableName: 'encounters', timestamps: true });

module.exports = Encounter;
