require('dotenv').config();
process.env.DB_HOST = '127.0.0.1';
const sequelize = require('./src/config/db');

async function run() {
    try {
        await sequelize.authenticateDatabase();
        console.log('DB Connected.');

        const values = ['SENT', 'ATTENDED', 'OUTCOME_RECORDED', 'CLOSED', 'REJECTED'];
        for (const val of values) {
            try {
                await sequelize.query(`ALTER TYPE "enum_health_worker_referrals_status" ADD VALUE IF NOT EXISTS '${val}';`);
                console.log(`Added ${val}`);
            } catch (err) {
                console.error(`Error adding ${val}:`, err.message);
            }
        }
    } catch (e) {
        console.error('DB Connection error:', e.message);
    }
    process.exit(0);
}
run();
