const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const INCOME_BRACKET = Object.freeze({
    BELOW_1LPA: 'below_1lpa',
    ONE_TO_3LPA: '1_3lpa',
    THREE_TO_5LPA: '3_5lpa',
    ABOVE_5LPA: 'above_5lpa',
});

const SUBSIDY_STATUS = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
});

// Pincodes considered "underserved" for the simulated subsidy scheme
const UNDERSERVED_PINCODES = [
    '831001', '831002', '831003', '832101', '832102', // Jharkhand
    '828401', '828402', '834001', '834002', '835101', // Rural Jharkhand
    '110001', '110002', // Delhi underserved zones
    '400001', '400002', // Mumbai underserved zones
];

const SubsidyApplication = sequelize.define(
    'SubsidyApplication',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true, // one application per patient
        },
        incomeBracket: {
            type: DataTypes.ENUM(...Object.values(INCOME_BRACKET)),
            allowNull: false,
        },
        pincode: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        idProofUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(SUBSIDY_STATUS)),
            allowNull: false,
            defaultValue: SUBSIDY_STATUS.PENDING,
        },
        subsidyPercent: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Percentage discount applied to consultation fee (0-100)',
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'subsidy_applications',
        timestamps: true,
    }
);

module.exports = { SubsidyApplication, INCOME_BRACKET, SUBSIDY_STATUS, UNDERSERVED_PINCODES };
