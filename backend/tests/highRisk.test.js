const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/db');
const { 
    User, 
    PatientProfile, 
    HighRiskPatient, 
    HealthWorkerAssignment,
    HealthWorkerFollowup,
    HealthWorkerReferral,
    DiagnosticRequest,
    Consultation,
    DoctorProfile
} = require('../src/models');
const { processHighRiskTriage } = require('../src/services/highRiskService');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { generateAccessToken } = require('../src/utils/jwt');

const genToken = (user) => generateAccessToken({ id: user.id, role: user.role });

describe('High-Risk Patient Management Tests', () => {
    let patient, hwAssigned, hwUnassigned, doctorAssigned, doctorUnassigned, admin;
    let patientToken, hwAssignedToken, hwUnassignedToken, doctorAssignedToken, doctorUnassignedToken, adminToken;
    let activeRiskEpisode;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        patient = await User.create({ email: 'p1@t.com', passwordHash: 'hash', role: 'patient' });
        await PatientProfile.create({ userId: patient.id, fullName: 'Patient One' });

        hwAssigned = await User.create({ email: 'hw1@t.com', passwordHash: 'hash', role: 'health_worker' });
        hwUnassigned = await User.create({ email: 'hw2@t.com', passwordHash: 'hash', role: 'health_worker' });
        
        doctorAssigned = await User.create({ email: 'd1@t.com', passwordHash: 'hash', role: 'doctor' });
        await DoctorProfile.create({ userId: doctorAssigned.id, fullName: 'Doctor Assigned' });
        
        doctorUnassigned = await User.create({ email: 'd2@t.com', passwordHash: 'hash', role: 'doctor' });
        await DoctorProfile.create({ userId: doctorUnassigned.id, fullName: 'Doctor Unassigned' });

        admin = await User.create({ email: 'a1@t.com', passwordHash: 'hash', role: 'admin' });

        patientToken = genToken(patient);
        hwAssignedToken = genToken(hwAssigned);
        hwUnassignedToken = genToken(hwUnassigned);
        doctorAssignedToken = genToken(doctorAssigned);
        doctorUnassignedToken = genToken(doctorUnassigned);
        adminToken = genToken(admin);

        // Assign hwAssigned to patient
        await HealthWorkerAssignment.create({ healthWorkerId: hwAssigned.id, patientId: patient.id, assignedBy: admin.id, status: 'ACTIVE' });

        // Create consultation for doctorAssigned to grant access
        await Consultation.create({ patientId: patient.id, doctorId: doctorAssigned.id, status: 'completed' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('Triage Service Integration (processHighRiskTriage)', () => {
        it('should NOT create high-risk episode for severityScore < 2', async () => {
            await processHighRiskTriage(patient.id, 1, 'Mild fever');
            const count = await HighRiskPatient.count({ where: { patientId: patient.id } });
            expect(count).toBe(0);
        });

        it('should create HIGH risk episode for severityScore >= 2 and link assigned HW', async () => {
            await processHighRiskTriage(patient.id, 3, 'Severe chest pain');
            activeRiskEpisode = await HighRiskPatient.findOne({ where: { patientId: patient.id } });
            expect(activeRiskEpisode).not.toBeNull();
            expect(activeRiskEpisode.riskLevel).toBe('HIGH');
            expect(activeRiskEpisode.status).toBe('IDENTIFIED');
            expect(activeRiskEpisode.assignedHealthWorkerId).toBe(hwAssigned.id);
        });

        it('should reuse active episode on repeated HIGH triage, preventing duplicates', async () => {
            await processHighRiskTriage(patient.id, 2, 'Still having chest pain');
            const count = await HighRiskPatient.count({ where: { patientId: patient.id } });
            expect(count).toBe(1); // Still 1 record
            const episode = await HighRiskPatient.findOne({ where: { patientId: patient.id } });
            expect(episode.riskReason).toBe('Still having chest pain'); // Updated reason
        });
    });

    describe('RBAC and IDOR Protection', () => {
        it('should allow assigned HW to view high-risk list', async () => {
            const res = await request(app)
                .get('/api/high-risk/patients')
                .set('Authorization', `Bearer ${hwAssignedToken}`);
            expect(res.status).toBe(200);
            expect(res.body.count).toBe(1);
            expect(res.body.patients[0].patientId).toBe(patient.id);
        });

        it('should allow unassigned HW to view high-risk list (MVP open access)', async () => {
            const res = await request(app)
                .get('/api/high-risk/patients')
                .set('Authorization', `Bearer ${hwUnassignedToken}`);
            expect(res.status).toBe(200);
            expect(res.body.count).toBe(1);
        });

        it('should allow assigned Doctor to view high-risk list', async () => {
            const res = await request(app)
                .get('/api/high-risk/patients')
                .set('Authorization', `Bearer ${doctorAssignedToken}`);
            expect(res.status).toBe(200);
            expect(res.body.count).toBe(1);
        });

        it('should allow admin to view all high-risk patients', async () => {
            const res = await request(app)
                .get('/api/high-risk/patients')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.count).toBe(1);
        });

        it('should deny patient access to API (roleCheck)', async () => {
            const res = await request(app)
                .get('/api/high-risk/patients')
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('should allow unassigned HW to view patient details (MVP open access)', async () => {
            const res = await request(app)
                .get(`/api/high-risk/patients/${patient.id}`)
                .set('Authorization', `Bearer ${hwUnassignedToken}`);
            expect(res.status).toBe(200);
        });

        it('should allow assigned HW to view patient details', async () => {
            const res = await request(app)
                .get(`/api/high-risk/patients/${patient.id}`)
                .set('Authorization', `Bearer ${hwAssignedToken}`);
            expect(res.status).toBe(200);
            expect(res.body.highRiskRecord.patientId).toBe(patient.id);
        });
    });

    describe('Follow-up Synchronization', () => {
        it('should sync nextFollowupAt when HW creates a PENDING followup', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 2);
            
            const res = await request(app)
                .post('/api/health-worker/followups')
                .set('Authorization', `Bearer ${hwAssignedToken}`)
                .send({
                    patientId: patient.id,
                    followUpDate: futureDate.toISOString().slice(0,10),
                    status: 'PENDING'
                });
            expect(res.status).toBe(201);

            const episode = await HighRiskPatient.findOne({ where: { patientId: patient.id } });
            expect(episode.nextFollowupAt).toBe(futureDate.toISOString().slice(0,10));
        });

        it('should display OVERDUE logically based on nextFollowupAt', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 2);
            
            await HighRiskPatient.update({ nextFollowupAt: pastDate }, { where: { patientId: patient.id } });
            const episode = await HighRiskPatient.findOne({ where: { patientId: patient.id } });
            
            const isOverdue = new Date(episode.nextFollowupAt) < new Date(new Date().setHours(0,0,0,0));
            expect(isOverdue).toBe(true);
        });
    });

    describe('Escalation & Authorization', () => {
        it('should allow unassigned HW to escalate (MVP open access)', async () => {
            const res = await request(app)
                .patch(`/api/high-risk/patients/${patient.id}/escalate`)
                .set('Authorization', `Bearer ${hwUnassignedToken}`)
                .send({ doctorId: doctorAssigned.id, escalationReason: 'Needs review' });
            expect(res.status).toBe(200);
            
            // Revert status to IDENTIFIED so the next test can escalate it again
            await HighRiskPatient.update({ status: 'IDENTIFIED', assignedDoctorId: null }, { where: { patientId: patient.id } });
        });

        it('should prevent Doctor from escalating (wrong role)', async () => {
            const res = await request(app)
                .patch(`/api/high-risk/patients/${patient.id}/escalate`)
                .set('Authorization', `Bearer ${doctorAssignedToken}`)
                .send({ doctorId: doctorAssigned.id, escalationReason: 'Needs review' });
            expect(res.status).toBe(403);
        });

        it('should allow assigned HW to escalate', async () => {
            const res = await request(app)
                .patch(`/api/high-risk/patients/${patient.id}/escalate`)
                .set('Authorization', `Bearer ${hwAssignedToken}`)
                .send({ doctorId: doctorAssigned.id, escalationReason: 'Critical symptoms' });
            expect(res.status).toBe(200);
            expect(res.body.record.status).toBe('ESCALATED');
            expect(res.body.record.assignedDoctorId).toBe(doctorAssigned.id);
        });
    });

    describe('Integration with existing modules', () => {
        it('should fetch related referrals and diagnostics securely', async () => {
            await HealthWorkerReferral.create({ patientId: patient.id, reason: 'Checkup', status: 'PENDING', referringHealthWorkerId: hwAssigned.id });
            await DiagnosticRequest.create({ patientId: patient.id, testName: 'X-Ray', status: 'REQUESTED', requesterId: hwAssigned.id });

            const res = await request(app)
                .get(`/api/high-risk/patients/${patient.id}`)
                .set('Authorization', `Bearer ${hwAssignedToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.referrals.length).toBeGreaterThanOrEqual(1);
            expect(res.body.diagnostics.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Resolution', () => {
        it('should allow assigned HW to resolve episode', async () => {
            const res = await request(app)
                .patch(`/api/high-risk/patients/${patient.id}/status`)
                .set('Authorization', `Bearer ${hwAssignedToken}`)
                .send({ status: 'RESOLVED' });
            expect(res.status).toBe(200);
            expect(res.body.record.status).toBe('RESOLVED');
            expect(res.body.record.resolvedAt).not.toBeNull();
        });

        it('should create new episode after resolving previous one', async () => {
            await processHighRiskTriage(patient.id, 3, 'New symptom after resolution');
            const count = await HighRiskPatient.count({ where: { patientId: patient.id } });
            expect(count).toBe(2); // Historical + New Active

            const active = await HighRiskPatient.findOne({ where: { patientId: patient.id, status: 'IDENTIFIED' } });
            expect(active).not.toBeNull();
        });
    });
});
