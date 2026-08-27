const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PatientProfile = sequelize.define('PatientProfile', {
  userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  age: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 150 } },
  region: { type: DataTypes.STRING(120), allowNull: true },
  languagePreference: { type: DataTypes.STRING(80), allowNull: true },
}, { tableName: 'patient_profiles', timestamps: true });

module.exports = PatientProfile;