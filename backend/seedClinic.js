const { User, ClinicProfile } = require('./src/models');
const sequelize = require('./src/config/db');
const { VERIFICATION_STATUS } = require('./src/constants/roles');
const bcrypt = require('bcryptjs');

async function seedClinic() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'clinic@sanjeevani.dev';
        const phone = '1122334455';
        
        let user = await User.findOne({ where: { email } });
        if (!user) {
            const passwordHash = await bcrypt.hash('clinic1234', 10);
            user = await User.create({
                email,
                phone,
                passwordHash,
                role: 'clinic_admin',
                isVerified: true
            });
            console.log(`Created clinic user ${email}`);
            
            await ClinicProfile.create({
                userId: user.id,
                clinicName: 'Sanjeevani Central Hospital',
                city: 'Test City',
                address: '123 Health Ave, Block B',
                licenseNumber: 'CLINIC-999-TEST',
                verificationStatus: VERIFICATION_STATUS.VERIFIED
            });
            console.log('Created clinic profile.');
        } else {
            let profile = await ClinicProfile.findOne({ where: { userId: user.id } });
            if (!profile) {
                await ClinicProfile.create({
                    userId: user.id,
                    clinicName: 'Sanjeevani Central Hospital',
                    city: 'Test City',
                    address: '123 Health Ave, Block B',
                    licenseNumber: 'CLINIC-999-TEST',
                    verificationStatus: VERIFICATION_STATUS.VERIFIED
                });
                console.log('Created clinic profile for existing user.');
            } else {
                await profile.update({ verificationStatus: VERIFICATION_STATUS.VERIFIED });
                console.log('Verified existing clinic profile.');
            }
        }

        console.log('Done seeding clinic!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedClinic();
