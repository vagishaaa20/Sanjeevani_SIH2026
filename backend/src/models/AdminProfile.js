const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminProfile = sequelize.define('AdminProfile', {
  userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  facilityId: { type: DataTypes.STRING(120), allowNull: true },
  permissionScope: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, { tableName: 'admin_profiles', timestamps: true });

module.exports = AdminProfile;