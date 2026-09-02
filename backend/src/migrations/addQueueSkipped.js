require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticateDatabase();

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "queue_skipped" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "queueId" UUID NOT NULL,
                "doctorId" UUID NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ queue_skipped table created');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sequelize.close();
    }
}

migrate();
