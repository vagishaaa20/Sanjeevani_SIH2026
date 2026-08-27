const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DoctorProfile = sequelize.define('DoctorProfile', {
  userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  specialization: { type: DataTypes.STRING(150), allowNull: true },
  credentials: { type: DataTypes.TEXT, allowNull: true },
  verifiedOnChain: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  regionsServed: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
}, { tableName: 'doctor_profiles', timestamps: true });

module.exports = DoctorProfile;