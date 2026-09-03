const sequelize = require('./src/config/db');

async function run() {
    try {
        await sequelize.authenticateDatabase();
        await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS one_active_queue_per_patient ON queues ("patientId") WHERE status IN ('WAITING', 'SERVING')`);
        console.log('Index created successfully.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
