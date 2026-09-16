const { Op } = require('sequelize');
const {
    HighRiskPatient,
    PatientProfile,
    User,
    HealthWorkerAssignment,
    HealthWorkerFollowup,
    HealthWorkerReferral,
    Consultation,
    DoctorProfile,
    HealthWorkerProfile,
    DiagnosticRequest
} = require('../models');

// Utility to check valid UUID
function isValidUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// Authorization Helper: Checks if the user has a right to access this high-risk patient
async function isAuthorized(reqUser, patientId) {
    if (reqUser.role === 'admin' || reqUser.role === 'health_worker') return true;

    if (reqUser.role === 'doctor') {
        const consultation = await Consultation.findOne({ where: { doctorId: reqUser.id, patientId } });
        if (consultation) return true;
        const referral = await HealthWorkerReferral.findOne({ where: { toDoctorId: reqUser.id, patientId } });
        if (referral) return true;
        const assignedRisk = await HighRiskPatient.findOne({ where: { assignedDoctorId: reqUser.id, patientId } });
        if (assignedRisk) return true;
        return false;
    }

    return false;
}

// GET /api/high-risk/patients
async function listPatients(req, res) {
    try {
        let whereClause = {};
        
        if (req.user.role === 'health_worker') {
            // Health workers can see all high risk patients
            whereClause = {};
        } else if (req.user.role === 'doctor') {
            // High risk patients escalated to this doctor, or patients they have seen
            const consultations = await Consultation.findAll({ where: { doctorId: req.user.id } });
            const referrals = await HealthWorkerReferral.findAll({ where: { toDoctorId: req.user.id } });
            
            const patientIds = new Set([
                ...consultations.map(c => c.patientId),
                ...referrals.map(r => r.patientId)
            ]);
            whereClause = {
                [Op.or]: [
                    { assignedDoctorId: req.user.id },
                    patientIds.size > 0 ? { patientId: { [Op.in]: Array.from(patientIds) } } : null
                ].filter(Boolean)
            };
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

        const patients = await HighRiskPatient.findAll({
            where: whereClause,
            include: [
                {
                    model: PatientProfile,
                    as: 'patientProfile',
                    attributes: ['fullName', 'dateOfBirth', 'sex', 'region']
                },
                {
                    model: User,
                    as: 'assignedHealthWorker',
                    attributes: ['id'],
                    include: [{ model: HealthWorkerProfile, as: 'healthWorkerProfile', attributes: ['name'] }]
                },
                {
                    model: User,
                    as: 'assignedDoctor',
                    attributes: ['id'],
                    include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: ['fullName'] }]
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        return res.json({ count: patients.length, patients });
    } catch (err) {
        console.error('[highRiskController.listPatients] Error:', err);
        return res.status(500).json({ error: 'Failed to fetch high risk patients' });
    }
}

// GET /api/high-risk/patients/:patientId
async function patientDetails(req, res) {
    const { patientId } = req.params;
    if (!isValidUuid(patientId)) return res.status(400).json({ error: 'Invalid patient ID' });

    try {
        if (!(await isAuthorized(req.user, patientId))) {
            return res.status(403).json({ error: 'Not authorized to view this patient' });
        }

        const highRiskRecord = await HighRiskPatient.findOne({
            where: { patientId },
            include: [
                {
                    model: PatientProfile,
                    as: 'patientProfile',
                    attributes: ['fullName', 'dateOfBirth', 'sex', 'region', 'medicalConditions', 'allergies']
                },
                {
                    model: User,
                    as: 'patient',
                    attributes: ['phone']
                },
                {
                    model: User,
                    as: 'assignedHealthWorker',
                    attributes: ['id'],
                    include: [{ model: HealthWorkerProfile, as: 'healthWorkerProfile', attributes: ['name'] }]
                },
                {
                    model: User,
                    as: 'assignedDoctor',
                    attributes: ['id'],
                    include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: ['fullName'] }]
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        if (!highRiskRecord) return res.status(404).json({ error: 'High risk record not found' });

        const [followups, referrals, diagnostics] = await Promise.all([
            HealthWorkerFollowup.findAll({ where: { patientId }, order: [['followUpDate', 'DESC']] }),
            HealthWorkerReferral.findAll({ where: { patientId }, order: [['createdAt', 'DESC']] }),
            DiagnosticRequest.findAll({ where: { patientId }, order: [['createdAt', 'DESC']] })
        ]);

        return res.json({
            highRiskRecord,
            followups,
            referrals,
            diagnostics
        });
    } catch (err) {
        console.error('[highRiskController.patientDetails] Error:', err);
        return res.status(500).json({ error: 'Failed to fetch details' });
    }
}

// PATCH /api/high-risk/patients/:patientId/escalate
async function escalatePatient(req, res) {
    const { patientId } = req.params;
    const { doctorId, escalationReason } = req.body;

    if (!isValidUuid(patientId) || !isValidUuid(doctorId) || !escalationReason) {
        return res.status(400).json({ error: 'patientId, doctorId, and escalationReason are required' });
    }

    try {
        if (req.user.role !== 'health_worker') return res.status(403).json({ error: 'Only health workers can escalate' });
        
        if (!(await isAuthorized(req.user, patientId))) {
            return res.status(403).json({ error: 'Not authorized to escalate this patient' });
        }

        const highRiskRecord = await HighRiskPatient.findOne({
            where: { patientId, status: { [Op.ne]: 'RESOLVED' } },
            order: [['updatedAt', 'DESC']]
        });

        if (!highRiskRecord) return res.status(404).json({ error: 'Active high risk record not found' });

        highRiskRecord.status = 'ESCALATED';
        highRiskRecord.assignedDoctorId = doctorId;
        highRiskRecord.escalationReason = escalationReason;
        await highRiskRecord.save();

        return res.json({ message: 'Patient escalated to doctor successfully', record: highRiskRecord });
    } catch (err) {
        console.error('[highRiskController.escalatePatient] Error:', err);
        return res.status(500).json({ error: 'Failed to escalate patient' });
    }
}

// PATCH /api/high-risk/patients/:patientId/status
async function updateStatus(req, res) {
    const { patientId } = req.params;
    const { status } = req.body;

    if (!isValidUuid(patientId) || !['IDENTIFIED', 'MONITORING', 'ESCALATED', 'REFERRED', 'RESOLVED'].includes(status)) {
        return res.status(400).json({ error: 'Valid patientId and status are required' });
    }

    try {
        if (!(await isAuthorized(req.user, patientId))) {
            return res.status(403).json({ error: 'Not authorized to update this patient' });
        }

        const highRiskRecord = await HighRiskPatient.findOne({
            where: { patientId },
            order: [['updatedAt', 'DESC']]
        });

        if (!highRiskRecord) return res.status(404).json({ error: 'High risk record not found' });

        highRiskRecord.status = status;
        if (status === 'RESOLVED') {
            highRiskRecord.resolvedAt = new Date();
        }
        await highRiskRecord.save();

        return res.json({ message: 'Status updated', record: highRiskRecord });
    } catch (err) {
        console.error('[highRiskController.updateStatus] Error:', err);
        return res.status(500).json({ error: 'Failed to update status' });
    }
}

// POST /api/high-risk/patients/:patientId/manual
async function createManualHighRisk(req, res) {
    const { patientId } = req.params;
    const { riskReason } = req.body;
    
    if (!isValidUuid(patientId)) return res.status(400).json({ error: 'Invalid patient ID' });

    try {
        if (req.user.role !== 'health_worker') {
            return res.status(403).json({ error: 'Only health workers can manually create high risk records' });
        }
        
        // Allow marking any patient in the system as High Risk
        const patientExists = await User.findOne({ where: { id: patientId, role: 'patient' } });
        if (!patientExists) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const existing = await HighRiskPatient.findOne({
            where: { patientId, status: { [Op.ne]: 'RESOLVED' } }
        });

        if (existing) {
            return res.status(400).json({ error: 'Patient already has an active high-risk record' });
        }

        const newRecord = await HighRiskPatient.create({
            patientId,
            riskLevel: 'HIGH',
            riskReason: riskReason || 'Manually marked by Health Worker',
            status: 'IDENTIFIED',
            assignedHealthWorkerId: req.user.id,
            identifiedAt: new Date()
        });

        return res.json({ message: 'Patient marked as high risk', record: newRecord });
    } catch (err) {
        console.error('[highRiskController.createManualHighRisk] Error:', err);
        return res.status(500).json({ error: 'Failed to create high risk record' });
    }
}

module.exports = {
    listPatients,
    patientDetails,
    escalatePatient,
    updateStatus,
    createManualHighRisk
};
