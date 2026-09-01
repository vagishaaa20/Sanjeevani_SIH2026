const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OutbreakAlert = sequelize.define(
    'OutbreakAlert',
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        geohash: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        diseaseCategory: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'disease_category',
        },
        caseCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'case_count',
        },
        thresholdBreachedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'threshold_breached_at',
        },
        riskLevel: {
            type: DataTypes.ENUM('watch', 'moderate', 'severe'),
            allowNull: false,
            defaultValue: 'watch',
            field: 'risk_level',
        },
        centerLat: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            field: 'center_lat',
        },
        centerLng: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            field: 'center_lng',
        },
        radiusKm: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: false,
            defaultValue: 10,
            field: 'radius_km',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_active',
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'resolved_at',
        },
        notifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'notified_at',
        },
    },
    {
        tableName: 'outbreak_alerts',
        timestamps: true,
        underscored: true,
    }
);

module.exports = OutbreakAlert;
