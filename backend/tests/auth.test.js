const request = require('supertest');
const app = require('../src/app');

describe('API health', () => {
  test('GET /api/health reports a running API', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});