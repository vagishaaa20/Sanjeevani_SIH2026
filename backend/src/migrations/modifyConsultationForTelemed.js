require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticateDatabase();

        await sequelize.query(`
            ALTER TABLE consultations 
            ADD COLUMN IF NOT EXISTS "roomId" UUID DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "webrtcStatus" VARCHAR(255) DEFAULT 'scheduled',
            ADD COLUMN IF NOT EXISTS "notes" TEXT DEFAULT NULL;
        `);
        console.log('✅ consultations table altered for Telemed');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sequelize.close();
    }
}

migrate();
