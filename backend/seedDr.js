const bcrypt = require('bcryptjs');
const { User, DoctorProfile } = require('./src/models');
const sequelize = require('./src/config/db');
const { VERIFICATION_STATUS } = require('./src/constants/roles');

async function seedDoctor() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'drtest@sanjeevani.dev';
        const passwordHash = await bcrypt.hash('doctor1234', 10);

        let user = await User.findOne({ where: { email } });
        if (!user) {
            user = await User.create({
                email,
                phone: '1234567890',
                passwordHash,
                role: 'doctor',
                isVerified: true
            });
            console.log(`Created user ${email}`);
            
            await DoctorProfile.create({
                userId: user.id,
                fullName: 'Dr. Quick Test',
                specialization: 'General Physician',
                verificationStatus: VERIFICATION_STATUS.VERIFIED
            });
            console.log('Created doctor profile.');
        } else {
            await user.update({ passwordHash });
            console.log(`Updated password for ${email}`);
            
            let profile = await DoctorProfile.findOne({ where: { userId: user.id } });
            if (!profile) {
                await DoctorProfile.create({
                    userId: user.id,
                    fullName: 'Dr. Quick Test',
                    specialization: 'General Physician',
                    verificationStatus: VERIFICATION_STATUS.VERIFIED
                });
                console.log('Created doctor profile.');
            } else {
                await profile.update({ verificationStatus: VERIFICATION_STATUS.VERIFIED });
                console.log('Verified doctor profile.');
            }
        }

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedDoctor();
