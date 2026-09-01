const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { FACILITY_TYPES } = require('../constants/facilityTypes');

const Facility = sequelize.define('Facility', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.ENUM(...Object.values(FACILITY_TYPES)), allowNull: false },
    parentId: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'facilities', timestamps: true });

module.exports = Facility;
