const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DoctorReview = sequelize.define(
    'DoctorReview',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        doctorId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        consultationId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true, // one review per consultation
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 },
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: 'doctor_reviews',
        timestamps: true,
    }
);

module.exports = DoctorReview;
