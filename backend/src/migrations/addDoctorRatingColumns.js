require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticateDatabase();
        console.log('Adding avgRating and reviewCount columns to doctor_profiles table...');

        await sequelize.query(`
            ALTER TABLE doctor_profiles 
            ADD COLUMN IF NOT EXISTS "avgRating" DECIMAL(3, 2) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0 NOT NULL;
        `);

        console.log('✅ Columns added successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sequelize.close();
    }
}

migrate();
