const bcrypt = require('bcryptjs');
const { User, PatientProfile, HealthWorkerProfile, HighRiskPatient, DoctorProfile } = require('./src/models');
const sequelize = require('./src/config/db');

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const passwordHash = await bcrypt.hash('Password123!', 10);

        // 1. Create Health Worker
        const healthWorker = await User.create({
            email: 'hw_test@example.com',
            phone: '1111111111',
            passwordHash,
            role: 'health_worker',
            isVerified: true
        });

        await HealthWorkerProfile.create({
            userId: healthWorker.id,
            name: 'Test Health Worker',
            area: 'Area 51',
            district: 'Test District',
            village: 'Test Village',
            workerType: 'ASHA',
            isVerified: true
        });

        console.log('\n--- Health Worker Credentials ---');
        console.log(`Email: ${healthWorker.email} | Password: Password123!`);

        // 2. Create Doctor
        const doctor = await User.create({
            email: 'doc_test@example.com',
            phone: '2222222222',
            passwordHash,
            role: 'doctor',
            isVerified: true
        });

        await DoctorProfile.create({
            userId: doctor.id,
            fullName: 'Dr. Test Doctor',
            specialization: 'General',
            yearsOfExperience: 5,
            verificationStatus: 'VERIFIED'
        });
        
        console.log('\n--- Doctor Credentials ---');
        console.log(`Email: ${doctor.email} | Password: Password123!`);

        // 3. Create Patients & HighRisk records
        console.log('\n--- Patient Credentials ---');
        for (let i = 1; i <= 3; i++) {
            const patientUser = await User.create({
                email: `highrisk_patient${i}@example.com`,
                phone: `333333333${i}`,
                passwordHash,
                role: 'patient',
                isVerified: true
            });

            await PatientProfile.create({
                userId: patientUser.id,
                fullName: `Test HighRisk Patient ${i}`,
                dateOfBirth: '1980-01-01',
                sex: 'female',
                abhaLinked: false,
                abhaConsentStatus: 'not_given',
                medicalConditions: ['Hypertension', 'Diabetes'],
                allergies: [],
                currentMedications: [],
                lifestyle: {},
                accountStatus: 'REGISTERED'
            });

            await HighRiskPatient.create({
                patientId: patientUser.id,
                riskLevel: 'HIGH',
                riskReason: `Risk reason ${i}`,
                status: 'IDENTIFIED',
                assignedHealthWorkerId: healthWorker.id,
                identifiedAt: new Date()
            });

            console.log(`Patient ${i} -> Email: ${patientUser.email} | Password: Password123!`);
        }
        
        console.log('\nData seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedData();
