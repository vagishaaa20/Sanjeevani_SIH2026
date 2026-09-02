const sequelize = require('./src/config/db');

async function run() {
    try {
        await sequelize.authenticateDatabase();
        await sequelize.query(`ALTER TYPE "enum_Consultations_status" ADD VALUE IF NOT EXISTS 'disconnected';`);
        console.log('Status updated');
    } catch (e) {
        console.error('status error', e.message);
    }
    try {
        await sequelize.query(`ALTER TYPE "enum_Consultations_webrtcStatus" ADD VALUE IF NOT EXISTS 'disconnected';`);
        console.log('webRtcStatus updated');
    } catch (e) {
        console.error('webrtcStatus error', e.message);
    }
    process.exit(0);
}
run();
