const request = require('supertest');
const app = require('../src/app');
const crypto = require('crypto');
const { User, PatientProfile, DoctorProfile, ClinicProfile, MedicineInventory } = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

const clinicIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
const testMedicine = `Audit Paracetamol ${Date.now()}mg`;
let patientToken;
let doctorToken;
let clinicTokens;
let createdIds = {};

beforeAll(async () => {
  const patient = await PatientProfile.findOne();
  if (!patient) throw new Error('An existing patient is required for medicine integration tests');

  const doctorId = crypto.randomUUID();
  await User.create({ id: doctorId, email: `medicine-doctor-${Date.now()}@example.com`, passwordHash: 'test-hash', role: 'doctor', isVerified: true });
  await DoctorProfile.create({ userId: doctorId, fullName: 'Medicine Audit Doctor', city: 'Audit City', specialization: 'General Practice' });

  for (const [index, clinicId] of clinicIds.entries()) {
    await User.create({ id: clinicId, email: `medicine-clinic-${Date.now()}-${index}@example.com`, passwordHash: 'test-hash', role: 'clinic_admin', isVerified: true });
    await ClinicProfile.create({
      userId: clinicId,
      clinicName: `Medicine Audit Clinic ${index + 1}`,
      licenseNumber: `MED-AUD-${Date.now()}-${index}`,
      city: 'Audit City',
      address: `Audit Address ${index + 1}`,
      latitude: 28.6 + index * 0.1,
      longitude: 77.2,
      verificationStatus: 'VERIFIED',
    });
  }

  patientToken = generateAccessToken({ id: patient.userId, role: 'patient' });
  doctorToken = generateAccessToken({ id: doctorId, role: 'doctor' });
  clinicTokens = clinicIds.map((id) => generateAccessToken({ id, role: 'clinic_admin' }));
  createdIds.doctorId = doctorId;
});

afterAll(async () => {
  await MedicineInventory.destroy({ where: { clinicId: clinicIds } });
  await ClinicProfile.destroy({ where: { userId: clinicIds } });
  await DoctorProfile.destroy({ where: { userId: createdIds.doctorId } });
  await User.destroy({ where: { id: [...clinicIds, createdIds.doctorId] } });
  await require('../src/config/redis').quit();
  await require('../src/config/db').close();
});

describe('Medicine inventory access control', () => {
  test('GET /api/medicine-inventory rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/medicine-inventory');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/medicine-inventory rejects unauthenticated access', async () => {
    const res = await request(app).post('/api/medicine-inventory').send({ medicineName: 'Paracetamol' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/medicines/search requires authentication', async () => {
    const res = await request(app).get('/api/medicines/search');
    expect(res.statusCode).toBe(401);
  });

  test('patient and doctor cannot write inventory', async () => {
    const patientResponse = await request(app)
      .post('/api/medicine-inventory')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ medicineName: testMedicine });
    const doctorResponse = await request(app)
      .post('/api/medicine-inventory')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ medicineName: testMedicine });

    expect(patientResponse.statusCode).toBe(403);
    expect(doctorResponse.statusCode).toBe(403);
  });

  test('clinic admin completes CRUD and availability transitions', async () => {
    let response = await request(app)
      .post('/api/medicine-inventory')
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ medicineName: testMedicine, genericName: 'acetaminophen', quantity: 30, lowStockThreshold: 10 });
    expect(response.statusCode).toBe(201);
    expect(response.body.item.status).toBe('AVAILABLE');
    createdIds.available = response.body.item.medicineId;

    response = await request(app)
      .get('/api/medicine-inventory')
      .set('Authorization', `Bearer ${clinicTokens[0]}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.items.some((item) => item.medicineId === createdIds.available && item.quantity === 30)).toBe(true);

    response = await request(app)
      .patch(`/api/medicine-inventory/${createdIds.available}`)
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ quantity: 3 });
    expect(response.body.item.status).toBe('LOW_STOCK');

    response = await request(app)
      .patch(`/api/medicine-inventory/${createdIds.available}`)
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ isAvailable: false });
    expect(response.body.item.status).toBe('UNAVAILABLE');

    response = await request(app)
      .patch(`/api/medicine-inventory/${createdIds.available}`)
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ isAvailable: true });
    expect(response.body.item.status).toBe('LOW_STOCK');

    response = await request(app)
      .patch(`/api/medicine-inventory/${createdIds.available}`)
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ quantity: 0 });
    expect(response.body.item.status).toBe('OUT_OF_STOCK');
  });

  test('duplicate medicine is rejected within a clinic but allowed in another clinic', async () => {
    const duplicate = await request(app)
      .post('/api/medicine-inventory')
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ medicineName: testMedicine.toLowerCase(), quantity: 12 });
    expect(duplicate.statusCode).toBe(409);

    const otherClinic = await request(app)
      .post('/api/medicine-inventory')
      .set('Authorization', `Bearer ${clinicTokens[1]}`)
      .send({ medicineName: testMedicine, quantity: 3, lowStockThreshold: 10 });
    expect(otherClinic.statusCode).toBe(201);
    createdIds.low = otherClinic.body.item.medicineId;

    const zeroClinic = await request(app)
      .post('/api/medicine-inventory')
      .set('Authorization', `Bearer ${clinicTokens[2]}`)
      .send({ medicineName: testMedicine, quantity: 0 });
    expect(zeroClinic.statusCode).toBe(201);
    expect(zeroClinic.body.item.status).toBe('OUT_OF_STOCK');
    createdIds.zero = zeroClinic.body.item.medicineId;
  });

  test('cross-clinic changes are rejected and patient search is sanitized and sorted', async () => {
    let response = await request(app)
      .patch(`/api/medicine-inventory/${createdIds.low}`)
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ quantity: 99 });
    expect(response.statusCode).toBe(404);

    response = await request(app)
      .delete(`/api/medicine-inventory/${createdIds.low}`)
      .set('Authorization', `Bearer ${clinicTokens[0]}`);
    expect(response.statusCode).toBe(404);

    response = await request(app)
      .get(`/api/medicines/search?query=${encodeURIComponent(testMedicine)}&lat=28.6&lng=77.2`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.results).toHaveLength(3);
    expect(response.body.results.map((item) => item.status)).toEqual(['OUT_OF_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']);
    expect(response.body.results.every((item) => !Object.prototype.hasOwnProperty.call(item, 'quantity'))).toBe(true);
    expect(response.body.results.every((item) => item.clinic.distanceKm !== null)).toBe(true);
  });

  test('invalid quantities and empty searches are rejected', async () => {
    let response = await request(app)
      .post('/api/medicine-inventory')
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ medicineName: `Invalid ${Date.now()}`, quantity: -1 });
    expect(response.statusCode).toBe(400);

    response = await request(app)
      .post('/api/medicine-inventory')
      .set('Authorization', `Bearer ${clinicTokens[0]}`)
      .send({ medicineName: `Invalid ${Date.now()}`, quantity: 'not-a-number' });
    expect(response.statusCode).toBe(400);

    response = await request(app)
      .get('/api/medicines/search?query=')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(response.statusCode).toBe(400);
  });
});
