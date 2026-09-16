const { User, PatientProfile } = require('./src/models');
const sequelize = require('./src/config/db');

async function seedPatient() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const phone = '9876543210';
        
        let user = await User.findOne({ where: { phone, role: 'patient' } });
        if (!user) {
            user = await User.create({
                phone,
                email: 'testpatient@example.com',
                passwordHash: 'dummy',
                role: 'patient',
                isVerified: true
            });
        }
        
        let profile = await PatientProfile.findOne({ where: { userId: user.id } });
        if (!profile) {
            await PatientProfile.create({
                userId: user.id,
                fullName: 'Test Patient',
                dateOfBirth: '1990-01-01',
                sex: 'male',
                region: 'Test Village'
            });
            console.log('Created patient profile.');
        } else {
            console.log(`Patient profile already exists.`);
        }

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedPatient();
