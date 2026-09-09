require('dotenv').config();
process.env.DB_HOST = '127.0.0.1';
const sequelize = require('./src/config/db');

async function run() {
    try {
        await sequelize.authenticateDatabase();
        console.log('DB Connected.');

        const queries = [
            `ALTER TABLE health_worker_referrals ADD COLUMN IF NOT EXISTS "referringHealthWorkerId" UUID REFERENCES users(id) ON DELETE SET NULL;`,
            `ALTER TABLE health_worker_referrals ADD COLUMN IF NOT EXISTS "outcome" TEXT;`,
            `ALTER TABLE health_worker_referrals ADD COLUMN IF NOT EXISTS "outcomeRecordedAt" TIMESTAMP WITH TIME ZONE;`,
            `ALTER TABLE health_worker_referrals ADD COLUMN IF NOT EXISTS "attendedAt" TIMESTAMP WITH TIME ZONE;`,
            `ALTER TABLE health_worker_referrals ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP WITH TIME ZONE;`
        ];

        for (const q of queries) {
            try {
                await sequelize.query(q);
                console.log('Executed:', q);
            } catch (err) {
                console.error('Error executing query:', err.message);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

run();
