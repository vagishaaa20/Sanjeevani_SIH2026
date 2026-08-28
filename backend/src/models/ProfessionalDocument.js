const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { DOCUMENT_TYPE, DOCUMENT_STATUS, ALL_ROLES } = require('../config/roles');

/**
 * ProfessionalDocument
 *
 * Tracks verification documents uploaded by doctors and HITL reviewers.
 * IMPORTANT: storageKey is a private, opaque reference (e.g. S3 object key or
 * encrypted local path). It must NEVER be exposed in public API responses.
 * Document URLs are generated on-demand by the admin layer via signed URLs or
 * equivalent mechanisms with restricted access.
 */
const ProfessionalDocument = sequelize.define(
  'ProfessionalDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ── Ownership ─────────────────────────────────────────────────────────────
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'userId of the doctor or reviewer who uploaded the document',
    },
    ownerRole: {
      type: DataTypes.ENUM(...ALL_ROLES),
      allowNull: false,
    },

    // ── Document metadata ─────────────────────────────────────────────────────
    documentType: {
      type: DataTypes.ENUM(...Object.values(DOCUMENT_TYPE)),
      allowNull: false,
    },
    /**
     * storageKey — private. Never expose this in API responses.
     * Example value: "docs/doctor/<userId>/reg_cert_abc123.pdf"
     */
    storageKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fileSizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1 },
    },

    // ── Verification state ────────────────────────────────────────────────────
    status: {
      type: DataTypes.ENUM(...Object.values(DOCUMENT_STATUS)),
      allowNull: false,
      defaultValue: DOCUMENT_STATUS.PENDING,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Admin userId who accepted or rejected this document',
    },

    /**
     * auditLog — append-only array of events.
     * Each entry: { action, actorId, actorRole, timestamp, note }
     */
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
