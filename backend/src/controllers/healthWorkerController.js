const { Op } = require('sequelize');
const {
    User,
    PatientProfile,
    HealthWorkerProfile,
    HealthWorkerAssignment,
    HealthWorkerFollowup,
    HealthWorkerReferral,
    DiseaseReport
} = require('../models');
const { enqueueFreeText } = require('../services/waCloudService');

const ACTIVE = 'ACTIVE';
const FOLLOWUP_STATUSES = ['PENDING', 'COMPLETED', 'MISSED'];
const FOLLOWUP_TYPES = ['CALL', 'VISIT', 'WHATSAPP', 'OTHER'];
const REFERRAL_STATUSES = ['PENDING', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

function isValidUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function assignedPatient(workerId, patientId) {
    return HealthWorkerAssignment.findOne({ where: { healthWorkerId: workerId, patientId, status: ACTIVE } });
}

async function latestRisks(patientIds) {
    if (!patientIds.length) return new Map();
    const reports = await DiseaseReport.findAll({
        where: { patientId: { [Op.in]: patientIds } },
        order: [['reportedAt', 'DESC']],
    });
    const result = new Map();
    reports.forEach((report) => {
        if (!result.has(report.patientId)) result.set(report.patientId, report);
    });
    return result;
}

function patientSummary(profile, risk, user) {
    return {
        patientId: profile.userId,
        name: profile.fullName || 'Unnamed patient',
        phone: user?.phone || null,
        dateOfBirth: profile.dateOfBirth,
        sex: profile.sex,
        region: profile.region,
        medicalConditions: profile.medicalConditions || [],
        allergies: profile.allergies || [],
        currentMedications: profile.currentMedications || [],
        risk: risk && Number(risk.severityScore) >= 2 ? 'HIGH' : 'NORMAL',
        latestTriage: risk ? {
            category: risk.diseaseCategory,
            severityScore: risk.severityScore,
            reportedAt: risk.reportedAt,
        } : null,
    };
}

async function listPatients(req, res) {
    try {
        const assignments = await HealthWorkerAssignment.findAll({ where: { healthWorkerId: req.user.id, status: ACTIVE }, order: [['assignedAt', 'DESC']] });
        const patientIds = assignments.map((assignment) => assignment.patientId);
        const profiles = await PatientProfile.findAll({ where: { userId: { [Op.in]: patientIds } }, include: [{ model: User, as: 'user', attributes: ['phone'] }] });
        const risks = await latestRisks(patientIds);
        const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
        return res.json({ count: profiles.length, patients: assignments.map((assignment) => patientSummary(profileMap.get(assignment.patientId), risks.get(assignment.patientId), profileMap.get(assignment.patientId)?.user)).filter(Boolean) });
    } catch (error) {
        console.error('[healthWorkerController.listPatients] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch assigned patients' });
    }
}

async function patientDetails(req, res) {
    const { patientId } = req.params;
    if (!isValidUuid(patientId)) return res.status(400).json({ error: 'Invalid patient ID' });
    try {
        if (!await assignedPatient(req.user.id, patientId)) return res.status(404).json({ error: 'Patient is not assigned to this health worker' });
        const profile = await PatientProfile.findOne({ where: { userId: patientId }, include: [{ model: User, as: 'user', attributes: ['phone'] }] });
        if (!profile) return res.status(404).json({ error: 'Patient not found' });
        const [risk, followups, referrals] = await Promise.all([
            DiseaseReport.findOne({ where: { patientId }, order: [['reportedAt', 'DESC']] }),
            HealthWorkerFollowup.findAll({ where: { patientId, healthWorkerId: req.user.id }, order: [['followUpDate', 'DESC']] }),
            HealthWorkerReferral.findAll({ where: { patientId }, order: [['createdAt', 'DESC']] }),
        ]);
        return res.json({ patient: patientSummary(profile, risk, profile.user), followups, referrals });
    } catch (error) {
        console.error('[healthWorkerController.patientDetails] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch patient details' });
    }
}

async function dashboard(req, res) {
    try {
        const assignments = await HealthWorkerAssignment.findAll({ where: { healthWorkerId: req.user.id, status: ACTIVE }, attributes: ['patientId'] });
        const patientIds = assignments.map((assignment) => assignment.patientId);
        const risks = await latestRisks(patientIds);
        const today = new Date().toISOString().slice(0, 10);
        const [pendingReferrals, followupsDue] = await Promise.all([
            HealthWorkerReferral.count({ where: { patientId: { [Op.in]: patientIds }, status: { [Op.in]: ['PENDING', 'ACCEPTED', 'SCHEDULED'] } } }),
            HealthWorkerFollowup.count({ where: { healthWorkerId: req.user.id, status: 'PENDING', followUpDate: { [Op.lte]: today } } }),
        ]);
        return res.json({ assignedPatients: patientIds.length, highRiskPatients: patientIds.filter((id) => Number(risks.get(id)?.severityScore) >= 2).length, pendingReferrals, followupsDue });
    } catch (error) {
        console.error('[healthWorkerController.dashboard] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
}

async function listDirectory(req, res) {
    const requestedRole = req.query.role;
    if (!['patient', 'health_worker'].includes(requestedRole)) {
        return res.status(400).json({ error: 'role must be patient or health_worker' });
    }
    try {
        const users = await User.findAll({
            where: { role: requestedRole },
            attributes: ['id', 'email', 'phone', 'role'],
            include: requestedRole === 'patient'
                ? [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'region'] }]
                : [{ model: HealthWorkerProfile, as: 'healthWorkerProfile', attributes: ['name', 'area', 'district', 'workerType'] }],
            order: [['createdAt', 'DESC']],
            limit: 100,
        });
        return res.json({ count: users.length, users });
    } catch (error) {
        console.error('[healthWorkerController.listDirectory] error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch directory' });
    }
}

async function listFollowups(req, res) {
    try {
        const followups = await HealthWorkerFollowup.findAll({ 
            where: { healthWorkerId: req.user.id },
            include: [{
                model: User,
                as: 'patient',
                attributes: ['id', 'phone'],
                include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'region'] }]
            }],
            order: [['followUpDate', 'ASC'], ['createdAt', 'DESC']] 
        });
        return res.json({ count: followups.length, followups });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch follow-ups' });
    }
}

async function createFollowup(req, res) {
    const { patientId, followUpDate, type = 'CALL', notes, status = 'PENDING' } = req.body;
    if (!isValidUuid(patientId) || !followUpDate) return res.status(400).json({ error: 'patientId and followUpDate are required' });
    if (!FOLLOWUP_TYPES.includes(type) || !FOLLOWUP_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid follow-up type or status' });
    if (Number.isNaN(Date.parse(followUpDate))) return res.status(400).json({ error: 'Invalid follow-up date' });
    try {
        if (!await assignedPatient(req.user.id, patientId)) return res.status(403).json({ error: 'Patient is not assigned to this health worker' });
        const followup = await HealthWorkerFollowup.create({ patientId, healthWorkerId: req.user.id, followUpDate, type, notes: notes ? String(notes).trim() : null, status });
        return res.status(201).json({ message: 'Follow-up saved', followup });
    } catch (error) {
        console.error('[healthWorkerController.createFollowup] error:', error.message);
        return res.status(500).json({ error: 'Failed to save follow-up' });
    }
}

async function patientFollowups(req, res) {
    const { patientId } = req.params;
    if (!isValidUuid(patientId)) return res.status(400).json({ error: 'Invalid patient ID' });
    if (!await assignedPatient(req.user.id, patientId)) return res.status(404).json({ error: 'Patient is not assigned to this health worker' });
    const followups = await HealthWorkerFollowup.findAll({ where: { patientId, healthWorkerId: req.user.id }, order: [['followUpDate', 'DESC']] });
    return res.json({ count: followups.length, followups });
}

async function listReferrals(req, res) {
    try {
        const assignments = await HealthWorkerAssignment.findAll({ where: { healthWorkerId: req.user.id, status: ACTIVE }, attributes: ['patientId'] });
        const referrals = await HealthWorkerReferral.findAll({ 
            where: { patientId: { [Op.in]: assignments.map((item) => item.patientId) } },
            include: [{
                model: User,
                as: 'patient',
                attributes: ['id', 'phone'],
                include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'region'] }]
            }],
            order: [['createdAt', 'DESC']] 
        });
        return res.json({ count: referrals.length, referrals });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch referrals' });
    }
}

async function updateReferral(req, res) {
    const { referralId } = req.params;
    const { status } = req.body;
    if (!isValidUuid(referralId) || !REFERRAL_STATUSES.includes(status)) return res.status(400).json({ error: 'Valid referral ID and status are required' });
    try {
        const referral = await HealthWorkerReferral.findByPk(referralId);
        if (!referral) return res.status(404).json({ error: 'Referral not found' });
        if (!await assignedPatient(req.user.id, referral.patientId)) return res.status(404).json({ error: 'Referral is not assigned to this health worker' });
        await referral.update({ status, completedAt: status === 'COMPLETED' ? new Date() : null });
        return res.json({ message: 'Referral status updated', referral });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update referral' });
    }
}

async function createReferral(req, res) {
    const { patientId, reason, specialization, priority = 'NORMAL', toClinicId, appointmentDate } = req.body;
    if (!isValidUuid(patientId) || !String(reason || '').trim()) return res.status(400).json({ error: 'patientId and reason are required' });
    if (!['NORMAL', 'HIGH', 'URGENT'].includes(priority)) return res.status(400).json({ error: 'Invalid referral priority' });
    try {
        const patient = await User.findOne({ where: { id: patientId, role: 'patient' } });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        const referral = await HealthWorkerReferral.create({
            patientId,
            doctorId: req.user.role === 'doctor' ? req.user.id : null,
            fromClinicId: req.user.role === 'clinic_admin' ? req.user.id : null,
            toClinicId: isValidUuid(toClinicId) ? toClinicId : null,
            specialization: specialization ? String(specialization).trim() : null,
            reason: String(reason).trim(),
            priority,
            appointmentDate: appointmentDate || null,
        });
        return res.status(201).json({ message: 'Referral created', referral });
    } catch (error) {
        console.error('[healthWorkerController.createReferral] error:', error.message);
        return res.status(500).json({ error: 'Failed to create referral' });
    }
}

async function sendPatientMessage(req, res) {
    const { patientId, message } = req.body;
    if (!isValidUuid(patientId) || !String(message || '').trim()) return res.status(400).json({ error: 'patientId and message are required' });
    try {
        if (!await assignedPatient(req.user.id, patientId)) return res.status(404).json({ error: 'Patient is not assigned to this health worker' });
        const patient = await User.findOne({ where: { id: patientId, role: 'patient' }, attributes: ['phone'] });
        if (!patient?.phone) return res.status(400).json({ error: 'Patient has no phone number' });
        await enqueueFreeText(patient.phone.replace('+', ''), String(message).trim());
        return res.json({ message: 'WhatsApp message queued' });
    } catch (error) {
        console.error('[healthWorkerController.sendPatientMessage] error:', error.message);
        return res.status(500).json({ error: 'Failed to queue patient message' });
    }
}

async function updateWorkerProfile(req, res) {
    const allowed = ['name', 'phone', 'workerType'];
    if (req.user.role !== 'health_worker') return res.status(403).json({ error: 'Only health workers can update this profile' });
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid profile fields provided' });
    if (updates.workerType && !['ASHA', 'ANM', 'COMMUNITY_WORKER', 'OTHER'].includes(updates.workerType)) return res.status(400).json({ error: 'Invalid worker type' });

    const profile = await HealthWorkerProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Health worker profile not found' });
    await profile.update(updates);
    if (updates.phone !== undefined) await User.update({ phone: updates.phone || null }, { where: { id: req.user.id } });
    return res.json({ message: 'Health Worker profile updated', profile });
}

module.exports = { dashboard, listPatients, patientDetails, listFollowups, createFollowup, patientFollowups, listReferrals, updateReferral, createReferral, sendPatientMessage, listDirectory, updateWorkerProfile };

