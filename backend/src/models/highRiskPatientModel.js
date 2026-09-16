const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HighRiskPatient = sequelize.define('HighRiskPatient', {
    id: { 
        type: DataTypes.UUID, 
        defaultValue: DataTypes.UUIDV4, 
        primaryKey: true 
    },
    patientId: { 
        type: DataTypes.UUID, 
        allowNull: false,
        field: 'patient_id'
    },
    riskLevel: { 
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'), 
        allowNull: false, 
        defaultValue: 'HIGH',
        field: 'risk_level'
    },
    riskReason: { 
        type: DataTypes.TEXT, 
        allowNull: true,
        field: 'risk_reason'
    },
    status: { 
        type: DataTypes.ENUM('IDENTIFIED', 'MONITORING', 'ESCALATED', 'REFERRED', 'RESOLVED'), 
        allowNull: false, 
        defaultValue: 'IDENTIFIED'
    },
    assignedHealthWorkerId: { 
        type: DataTypes.UUID, 
        allowNull: true,
        field: 'assigned_health_worker_id'
    },
    assignedDoctorId: { 
        type: DataTypes.UUID, 
        allowNull: true,
        field: 'assigned_doctor_id'
    },
    escalationReason: { 
        type: DataTypes.TEXT, 
        allowNull: true,
        field: 'escalation_reason'
    },
    nextFollowupAt: { 
        type: DataTypes.DATEONLY, 
        allowNull: true,
        field: 'next_followup_at'
    },
    lastFollowupAt: { 
        type: DataTypes.DATEONLY, 
        allowNull: true,
        field: 'last_followup_at'
    },
    identifiedAt: { 
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: DataTypes.NOW,
        field: 'identified_at'
    },
    resolvedAt: { 
        type: DataTypes.DATE, 
        allowNull: true,
        field: 'resolved_at'
    },
}, { 
    tableName: 'high_risk_patients', 
    timestamps: true,
    underscored: true
});

module.exports = HighRiskPatient;
