const request = require('supertest');
const app = require('../src/app');

afterAll(async () => {
  await require('../src/config/redis').quit();
  await require('../src/config/db').close();
});

describe('API health', () => {
  test('GET /api/health reports a running API', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('Auth — input validation (no DB required)', () => {
  test('POST /api/auth/register/patient — rejects missing phone', async () => {
    const res = await request(app).post('/api/auth/register/patient').send({ fullName: 'Test', dateOfBirth: '2000-01-01', sex: 'male' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/phone/i);
  });

  test('POST /api/auth/register/patient — rejects missing required fields', async () => {
    const res = await request(app).post('/api/auth/register/patient').send({ phone: '9876543210' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/fullName|dateOfBirth|sex/i);
  });

  test('POST /api/auth/register/doctor — rejects missing email', async () => {
    const res = await request(app).post('/api/auth/register/doctor').send({ fullName: 'Dr. Test', password: 'test1234' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('POST /api/auth/register/doctor — rejects missing city', async () => {
    const res = await request(app).post('/api/auth/register/doctor').send({ fullName: 'Dr. Test', email: 'doc@test.com', password: 'test1234' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/city/i);
  });

  test('POST /api/auth/register/doctor — rejects short password', async () => {
    const res = await request(app).post('/api/auth/register/doctor').send({ fullName: 'Dr. Test', email: 'doc@test.com', city: 'Delhi', password: 'short' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  test('POST /api/auth/register/hitl — rejects missing email', async () => {
    const res = await request(app).post('/api/auth/register/hitl').send({ fullName: 'Reviewer', password: 'test1234' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('POST /api/auth/login — rejects missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email|phone/i);
  });

  test('POST /api/auth/otp/send — rejects missing phone', async () => {
    const res = await request(app).post('/api/auth/otp/send').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/phone/i);
  });

  test('POST /api/auth/otp/verify — rejects missing userId/otp', async () => {
    const res = await request(app).post('/api/auth/otp/verify').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/userId|otp/i);
  });

  test('POST /api/auth/refresh — rejects missing refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/refresh token/i);
  });
});

describe('Profile routes — auth required', () => {
  test('GET /api/profile/me — rejects unauthenticated', async () => {
    const res = await request(app).get('/api/profile/me');
    expect(res.statusCode).toBe(401);
  });

  test('PATCH /api/profile/patient — rejects unauthenticated', async () => {
    const res = await request(app).patch('/api/profile/patient').send({});
    expect(res.statusCode).toBe(401);
  });

  test('PATCH /api/profile/doctor — rejects unauthenticated', async () => {
    const res = await request(app).patch('/api/profile/doctor').send({});
    expect(res.statusCode).toBe(401);
  });

  test('PATCH /api/profile/reviewer — rejects unauthenticated', async () => {
    const res = await request(app).patch('/api/profile/reviewer').send({});
    expect(res.statusCode).toBe(401);
  });
});

describe('Admin routes — auth + role required', () => {
  test('GET /api/admin/pending — rejects unauthenticated', async () => {
    const res = await request(app).get('/api/admin/pending');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/admin/users — rejects unauthenticated', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });

  test('PATCH /api/admin/verify/some-id — rejects unauthenticated', async () => {
    const res = await request(app).patch('/api/admin/verify/some-id').send({ action: 'approve' });
    expect(res.statusCode).toBe(401);
  });
});