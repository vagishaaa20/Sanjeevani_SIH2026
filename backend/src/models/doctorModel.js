const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { VERIFICATION_STATUS } = require('../constants/roles');

const DoctorProfile = sequelize.define(
    'DoctorProfile',
    {
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        medicalRegistrationNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
        },
        stateMedicalCouncil: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        registrationDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        primaryMedicalQualification: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        medicalCollege: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        graduationYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        specialization: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        subSpecialization: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        yearsOfExperience: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 0 },
        },
        consultationFee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        languages: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
        },
        regionsServed: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
        },
        clinicOrHospital: {
            type: DataTypes.STRING(250),
            allowNull: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        availability: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        verificationStatus: {
            type: DataTypes.ENUM(...Object.values(VERIFICATION_STATUS)),
            allowNull: false,
            defaultValue: VERIFICATION_STATUS.PENDING_VERIFICATION,
        },
        verifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        clinicId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'clinic_id',          // maps JS clinicId → DB column clinic_id
            references: {
                model: 'clinic_profiles',
                key: 'userId',
            },
            comment: 'FK to the clinic this doctor practices at, if any',
        },
        verificationNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            comment: 'Last known GPS latitude (auto-updated on login)',
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            comment: 'Last known GPS longitude (auto-updated on login)',
        },
        locationUpdatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        // ── Leaderboard / rating aggregates (updated by reviewController) ──────
        avgRating: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true,
            defaultValue: null,
            comment: 'Computed average of all doctor_reviews.rating for this doctor',
        },
        reviewCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Total number of patient reviews received',
        },
    },
    {
        tableName: 'doctor_profiles',
        timestamps: true,
    }
);

module.exports = DoctorProfile;
