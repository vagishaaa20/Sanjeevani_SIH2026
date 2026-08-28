const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TriageRequest = sequelize.define('TriageRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  symptoms: { type: DataTypes.TEXT, allowNull: false },
  duration: { type: DataTypes.STRING(120), allowNull: true },
  medicalHistory: { type: DataTypes.TEXT, allowNull: true },

  status: {
    type: DataTypes.ENUM('submitted', 'ai_analysis', 'doctor_review', 'reviewed'),
    allowNull: false,
    defaultValue: 'submitted',
  },

  // AI's raw suggestion — never shown to the patient directly
  aiUrgency: { type: DataTypes.ENUM('teleconsultation', 'doctor_visit', 'emergency'), allowNull: true },
  aiGuidance: { type: DataTypes.TEXT, allowNull: true },
  aiConfidence: { type: DataTypes.FLOAT, allowNull: true },

  // Doctor-confirmed final result — this is what the patient sees
  finalUrgency: { type: DataTypes.ENUM('teleconsultation', 'doctor_visit', 'emergency'), allowNull: true },
  finalGuidance: { type: DataTypes.TEXT, allowNull: true },
  reviewedBy: { type: DataTypes.UUID, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'triage_requests',
  timestamps: true,
});

module.exports = TriageRequest;