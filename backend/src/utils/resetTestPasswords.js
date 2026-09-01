require('dotenv').config();
const { User } = require('../models');
const { hashPassword } = require('./hash');

async function main() {
    const passwordHash = await hashPassword('doctor1234');

    const emails = [
        'drtest@sanjeevani.dev',
        'sohailkhan08@gmail.com'
    ];

    for (const email of emails) {
        const user = await User.findOne({ where: { email } });
        if (user) {
            await user.update({ passwordHash });
            console.log(`Password reset for ${email} to 'doctor1234'`);
        } else {
            console.warn(`User ${email} not found`);
        }
    }

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
