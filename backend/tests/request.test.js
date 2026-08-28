const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt');
const { ROLES } = require('../src/config/roles');

describe('Triage controller & helper routing protection', () => {
    test('POST /api/requests — rejects unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/requests')
            .send({ symptoms: 'Fever', location: 'Delhi', requirement: 'Doctor consultation' });
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/requests/my — rejects unauthenticated request', async () => {
        const res = await request(app)
            .get('/api/requests/my');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/requests/nearby — rejects unauthenticated request', async () => {
        const res = await request(app)
            .get('/api/requests/nearby');
        expect(res.statusCode).toBe(401);
    });
});

describe('Triage controller role check & input validation', () => {
    test('POST /api/requests — rejects request from doctor role', async () => {
        const docToken = generateAccessToken({ id: 10, role: ROLES.DOCTOR });
        const res = await request(app)
            .post('/api/requests')
            .set('Authorization', `Bearer ${docToken}`)
            .send({ symptoms: 'Fever', location: 'Delhi', requirement: 'Doctor consultation' });
        expect(res.statusCode).toBe(403);
    });

    test('POST /api/requests — rejects missing parameters', async () => {
        const patientToken = generateAccessToken({ id: 20, role: ROLES.PATIENT });
        const res = await request(app)
            .post('/api/requests')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({ symptoms: 'Fever' });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/Symptoms, Location, and Requirement/i);
    });

    test('GET /api/requests/nearby — rejects request from patient role', async () => {
        const patientToken = generateAccessToken({ id: 20, role: ROLES.PATIENT });
        const res = await request(app)
            .get('/api/requests/nearby')
            .set('Authorization', `Bearer ${patientToken}`);
        expect(res.statusCode).toBe(403);
    });
});
