const sequelize = require('./src/config/db');
const { User, PatientProfile, DoctorProfile, ClinicProfile } = require('./src/models');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        await sequelize.authenticateDatabase();

        const passwordHash = await bcrypt.hash('password123', 10);

        // Ensure Admin exists to own the clinic
        const devAdmin = await User.findOne({ where: { role: 'admin' } });
        if (!devAdmin) {
            throw new Error("Admin not found to bind clinic!");
        }

        const clinicId = '11111111-1111-4eda-8bb5-f788d72fb230';
        await ClinicProfile.findOrCreate({
            where: { id: clinicId },
            defaults: {
                name: 'Sanjeevani Care Clinic', address: '123 Test St', city: 'Jamshedpur', state: 'Jharkhand', userId: devAdmin.id
            }
        });

        const pPhone = '8888888888';
        const [pUser] = await User.findOrCreate({
            where: { phone: pPhone },
            defaults: { passwordHash, role: 'patient', isVerified: true, email: 'testpatient@gmail.com' }
        });

        await PatientProfile.findOrCreate({
            where: { userId: pUser.id },
            defaults: { fullName: 'Test Patient', dateOfBirth: '1990-01-01', gender: 'male', bloodGroup: 'O+', state: 'Jharkhand', city: 'Jamshedpur' }
        });

        const dPhone = '9999999999';
        const [dUser] = await User.findOrCreate({
            where: { phone: dPhone },
            defaults: { passwordHash, role: 'doctor', isVerified: true, email: 'testdoctor@gmail.com' }
        });

        await DoctorProfile.findOrCreate({
            where: { userId: dUser.id },
            defaults: { fullName: 'Test Doctor', specialization: 'General', experienceYears: 10, licenseNumber: 'LIC123', clinicId: clinicId }
        });

        console.log('SEED EXACT SUCCESS');
        process.exit(0);
    } catch (e) {
        console.error('SEED FAILED', e);
        process.exit(1);
    }
}
run();
