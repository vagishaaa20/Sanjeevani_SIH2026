const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const { User, PatientProfile, HealthWorkerProfile, HealthWorkerAssignment, HealthWorkerReferral } = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

const ids = { worker: crypto.randomUUID(), otherWorker: crypto.randomUUID(), patient: crypto.randomUUID(), otherPatient: crypto.randomUUID(), admin: crypto.randomUUID(), clinicAdmin: crypto.randomUUID(), doctor: crypto.randomUUID() };
const tokens = {};

beforeAll(async () => {
    await User.bulkCreate([
        { id: ids.worker, email: `worker-${Date.now()}@example.com`, passwordHash: 'test-hash', role: 'health_worker', isVerified: true },
        { id: ids.otherWorker, email: `worker-other-${Date.now()}@example.com`, passwordHash: 'test-hash', role: 'health_worker', isVerified: true },
        { id: ids.patient, phone: `+9199${Date.now().toString().slice(-8)}`, passwordHash: 'test-hash', role: 'patient', isVerified: true },
        { id: ids.otherPatient, phone: `+9188${Date.now().toString().slice(-8)}`, passwordHash: 'test-hash', role: 'patient', isVerified: true },
        { id: ids.admin, email: `admin-worker-${Date.now()}@example.com`, passwordHash: 'test-hash', role: 'admin', isVerified: true },
        { id: ids.clinicAdmin, email: `clinic-worker-${Date.now()}@example.com`, passwordHash: 'test-hash', role: 'clinic_admin', isVerified: true },
        { id: ids.doctor, email: `doctor-worker-${Date.now()}@example.com`, passwordHash: 'test-hash', role: 'doctor', isVerified: true },
    ]);
    await HealthWorkerProfile.bulkCreate([
        { userId: ids.worker, name: 'Test Worker', workerType: 'ASHA', isVerified: true },
        { userId: ids.otherWorker, name: 'Other Worker', workerType: 'ANM', isVerified: true },
    ]);
    await PatientProfile.bulkCreate([
        { userId: ids.patient, fullName: 'Assigned Patient', sex: 'other' },
        { userId: ids.otherPatient, fullName: 'Unassigned Patient', sex: 'other' },
    ]);

    await HealthWorkerAssignment.create({ patientId: ids.patient, healthWorkerId: ids.worker, assignedBy: ids.admin });
    tokens.worker = generateAccessToken({ id: ids.worker, role: 'health_worker' });
    tokens.otherWorker = generateAccessToken({ id: ids.otherWorker, role: 'health_worker' });
    tokens.admin = generateAccessToken({ id: ids.admin, role: 'admin' });
    tokens.clinicAdmin = generateAccessToken({ id: ids.clinicAdmin, role: 'clinic_admin' });
    tokens.doctor = generateAccessToken({ id: ids.doctor, role: 'doctor' });
});

afterAll(async () => {
    await HealthWorkerAssignment.destroy({ where: { [require('sequelize').Op.or]: [{ healthWorkerId: ids.worker }, { healthWorkerId: ids.otherWorker }] } });
    await HealthWorkerReferral.destroy({ where: { patientId: [ids.patient, ids.otherPatient] } });

    await HealthWorkerProfile.destroy({ where: { userId: [ids.worker, ids.otherWorker] } });
    await PatientProfile.destroy({ where: { userId: [ids.patient, ids.otherPatient] } });
    await User.destroy({ where: { id: Object.values(ids) } });
    const { inboundQueue, outboundQueue, medicationReminderQueue } = require('../src/config/queues');
    await Promise.all([inboundQueue.close(), outboundQueue.close(), medicationReminderQueue.close()]);
    await require('../src/config/redis').quit();
    await require('../src/config/db').close();
});

describe('Health Worker access control', () => {
    test('worker endpoints require authentication and role', async () => {
        expect((await request(app).get('/api/health-worker/dashboard')).statusCode).toBe(401);
        expect((await request(app).get('/api/health-worker/dashboard').set('Authorization', `Bearer ${tokens.admin}`)).statusCode).toBe(403);
    });



    test('clinic admin can assign and doctor can create a referral', async () => {
        let response = await request(app).get('/api/health-worker/directory?role=patient').set('Authorization', `Bearer ${tokens.clinicAdmin}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.users.some((user) => user.id === ids.patient)).toBe(true);



        response = await request(app).post('/api/health-worker/referrals').set('Authorization', `Bearer ${tokens.doctor}`).send({ patientId: ids.patient, reason: 'Specialist review', specialization: 'Cardiology', priority: 'HIGH' });
        expect(response.statusCode).toBe(201);
        expect(response.body.referral.doctorId).toBe(ids.doctor);
    });



    test('worker sees assigned patients only', async () => {
        const response = await request(app).get('/api/health-worker/patients').set('Authorization', `Bearer ${tokens.worker}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.patients.map((patient) => patient.patientId)).toEqual([ids.patient]);
    });

    test('worker cannot access another worker patient or create an unassigned follow-up', async () => {
        const detail = await request(app).get(`/api/health-worker/patients/${ids.otherPatient}`).set('Authorization', `Bearer ${tokens.worker}`);
        expect(detail.statusCode).toBe(404);
        const followup = await request(app).post('/api/health-worker/followups').set('Authorization', `Bearer ${tokens.worker}`).send({ patientId: ids.otherPatient, followUpDate: '2026-09-05', type: 'CALL' });
        expect(followup.statusCode).toBe(403);
    });

    test('assigned worker can create a follow-up and view dashboard counts', async () => {
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const followup = await request(app).post('/api/health-worker/followups').set('Authorization', `Bearer ${tokens.worker}`).send({ patientId: ids.patient, followUpDate: futureDate, type: 'CALL', notes: 'Checked in' });
        expect(followup.statusCode).toBe(201);
        const dashboard = await request(app).get('/api/health-worker/dashboard').set('Authorization', `Bearer ${tokens.worker}`);
        expect(dashboard.statusCode).toBe(200);
        expect(dashboard.body.assignedPatients).toBe(1);
        expect(dashboard.body.followupsDue).toBe(0);
    });
});