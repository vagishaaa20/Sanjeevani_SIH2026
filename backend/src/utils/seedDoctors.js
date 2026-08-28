const sequelize = require('../config/db');
const { User, DoctorProfile, PatientRequest, PatientProfile } = require('../models');
const { hashPassword } = require('./hash');
const { ROLES, VERIFICATION_STATUS } = require('../config/roles');

async function seedDoctorsAndRequests() {
    console.log('Altering database tables and seeding doctors and requests with coordinates...');

    // Enable PostGIS (idempotent — safe to run multiple times)
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('✓ PostGIS extension ready');

    // Add coordinate columns and PostGIS geography column to doctor_profiles
    await sequelize.query(`
        ALTER TABLE doctor_profiles
        ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);
    `);
    // Add coordinate columns to patient_requests
    await sequelize.query(`
        ALTER TABLE patient_requests
        ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
    `);
    console.log('✓ Schema columns ready');

    const t = await sequelize.transaction();
    try {
        const passwordHash = await hashPassword('password123');

        // 1. Create Patient User & Patient Profile (idempotent)
        const [patientUser, patCreated] = await User.findOrCreate({
            where: { email: 'patient_geo@sanjeevani.gov.in' },
            defaults: { passwordHash, role: ROLES.PATIENT, isVerified: true },
            transaction: t
        });
        if (patCreated) {
            await PatientProfile.create({
                userId: patientUser.id,
                fullName: 'Sanjeev Geo Patient',
                dateOfBirth: '1995-05-15',
                sex: 'Male',
                region: 'Delhi'
            }, { transaction: t });
        }

        // 2. Create Doctors
        const docData = [
            {
                email: 'doc_cardio@sanjeevani.gov.in',
                fullName: 'Dr. Cardio Close',
                specialization: 'Cardiologist',
                city: 'Delhi',
                lat: 28.6150,
                lng: 77.2100
            },
            {
                email: 'doc_physio@sanjeevani.gov.in',
                fullName: 'Dr. Physio Medium',
                specialization: 'Physiotherapist',
                city: 'Delhi',
                lat: 28.6250,
                lng: 77.2200
            },
            {
                email: 'doc_pediatric@sanjeevani.gov.in',
                fullName: 'Dr. Pediatric Far',
                specialization: 'Pediatrician',
                city: 'Delhi',
                lat: 28.5800,
                lng: 77.1500
            }
        ];

        for (const d of docData) {
            const [u, docCreated] = await User.findOrCreate({
                where: { email: d.email },
                defaults: { passwordHash, role: ROLES.DOCTOR, isVerified: true },
                transaction: t
            });

            if (docCreated) {
                await DoctorProfile.create({
                    userId: u.id,
                    fullName: d.fullName,
                    specialization: d.specialization,
                    clinicOrHospital: 'City General Clinic',
                    city: d.city,
                    consultationFee: 600,
                    availability: {
                        days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
                        start: '09:00',
                        end: '17:00'
                    },
                    yearsOfExperience: 8,
                    verificationStatus: VERIFICATION_STATUS.VERIFIED,
                    latitude: d.lat,
                    longitude: d.lng
                    // location auto-set by beforeSave hook
                }, { transaction: t });
            } else {
                // Update existing profile with coordinates + trigger hook
                const existingProfile = await DoctorProfile.findOne({ where: { userId: u.id }, transaction: t });
                if (existingProfile) {
                    await existingProfile.update({ latitude: d.lat, longitude: d.lng }, { transaction: t });
                }
            }
        }

        // 3. Create Patient Requests
        const requestData = [
            {
                symptoms: 'Chest pain and breathing difficulty, feeling pressure',
                requirement: 'Urgent Clinical Assessment',
                triageCategory: 'EMERGENCY_ESCALATION',
                lat: 28.6140,
                lng: 77.2095
            },
            {
                symptoms: 'Fever and dry cough for 3 days',
                requirement: 'General Doctor Consultation',
                triageCategory: 'TELECONSULTATION',
                lat: 28.6200,
                lng: 77.2150
            }
        ];

        for (const r of requestData) {
            await PatientRequest.create({
                patientId: patientUser.id,
                symptoms: r.symptoms,
                location: 'Delhi',
                requirement: r.requirement,
                triageCategory: r.triageCategory,
                triageReasoning: 'Seeded test case for coordinate proximity search',
                status: 'PENDING',
                latitude: r.lat,
                longitude: r.lng
            }, { transaction: t });
        }

        await t.commit();
        console.log('✓ Seeding complete.');
        process.exit(0);
    } catch (error) {
        await t.rollback();
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedDoctorsAndRequests();
