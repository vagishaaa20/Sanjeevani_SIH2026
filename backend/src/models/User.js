const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { ALL_ROLES, ROLES } = require('../config/roles');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING(255), allowNull: true, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(30), allowNull: true, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM(...ALL_ROLES), allowNull: false, defaultValue: ROLES.PATIENT },
  isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'users', timestamps: true, indexes: [{ unique: true, fields: ['email'] }, { unique: true, fields: ['phone'] }] });

module.exports = User;