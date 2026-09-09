const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DiseaseReport = sequelize.define(
    'DiseaseReport',
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: true, // null for anonymous/WhatsApp reports
            field: 'patient_id',
        },
        diseaseCategory: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'disease_category',
        },
        symptomTags: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: false,
            defaultValue: [],
            field: 'symptom_tags',
        },
        geohash: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        reportedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'reported_at',
        },
        source: {
            type: DataTypes.ENUM('triage', 'manual'),
            allowNull: false,
            defaultValue: 'triage',
        },
        severityScore: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 1,
            field: 'severity_score',
        },
    },
    {
        tableName: 'disease_reports',
        timestamps: true,
        underscored: true,
    }
);

module.exports = DiseaseReport;
