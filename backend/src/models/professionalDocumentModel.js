const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { DOCUMENT_TYPE, DOCUMENT_STATUS } = require('../constants/roles');

const ProfessionalDocument = sequelize.define(
  'ProfessionalDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // ownerRole exists in the DB from an earlier schema version; declare it to prevent drift
    ownerRole: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    documentType: {
      type: DataTypes.ENUM(...Object.values(DOCUMENT_TYPE)),
      allowNull: false,
    },
    // Where the file actually lives — local path for now, swap to an S3 key later
    // without changing the shape of this table.
    storageKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    originalFileName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fileSizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DOCUMENT_STATUS)),
      allowNull: false,
      defaultValue: DOCUMENT_STATUS.PENDING,
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Simple append-only history of who accepted/rejected this doc and when
    auditLog: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: 'professional_documents',
    timestamps: true,
  }
);

module.exports = ProfessionalDocument;