const sequelize = require('./src/config/db');

async function run() {
    try {
        await sequelize.authenticateDatabase();
        await sequelize.query(`ALTER TYPE "enum_queues_status" ADD VALUE IF NOT EXISTS 'CANCELLED'`);
        console.log('ENUM appended successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Failed ENUM insert: ', e);
        process.exit(1);
    }
}
run();
