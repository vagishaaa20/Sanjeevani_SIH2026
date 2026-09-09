const sequelize = require('./src/config/db');
const { User, Queue, Consultation, PatientProfile } = require('./src/models');

async function run() {
    try {
        await sequelize.authenticateDatabase();
        console.log('User count:', await User.count());
        console.log('Patient count:', await PatientProfile.count());
        console.log('Queue count:', await Queue.count());
        console.log('Consult count:', await Consultation.count());
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
