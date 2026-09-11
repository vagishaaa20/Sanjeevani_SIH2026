const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VERIFICATION_DOC_STATUS = Object.freeze({
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    RESUBMISSION_REQUIRED: 'RESUBMISSION_REQUIRED',
});

const VerificationDocument = sequelize.define(
    'VerificationDocument',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        role: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        documentType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'document_type',
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'file_name',
        },
        storagePath: {
            type: DataTypes.STRING(500),
            allowNull: false,
            field: 'storage_path',
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: 'application/pdf',
            field: 'mime_type',
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'file_size',
        },
        status: {
            type: DataTypes.ENUM(
                VERIFICATION_DOC_STATUS.PENDING,
                VERIFICATION_DOC_STATUS.APPROVED,
                VERIFICATION_DOC_STATUS.REJECTED,
                VERIFICATION_DOC_STATUS.RESUBMISSION_REQUIRED
            ),
            allowNull: false,
            defaultValue: VERIFICATION_DOC_STATUS.PENDING,
        },
        uploadedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'uploaded_at',
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'reviewed_at',
        },
        reviewedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'reviewed_by',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'rejection_reason',
        },
    },
    {
        tableName: 'verification_documents',
        timestamps: true,
        underscored: true,
    }
);

module.exports = VerificationDocument;
module.exports.VERIFICATION_DOC_STATUS = VERIFICATION_DOC_STATUS;
