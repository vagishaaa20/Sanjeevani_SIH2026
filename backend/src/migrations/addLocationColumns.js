/**
 * One-time migration: adds latitude, longitude, locationUpdatedAt columns
 * to patient_profiles and doctor_profiles tables.
 *
 * Run with:  node src/migrations/addLocationColumns.js
 */
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const qi = sequelize.getQueryInterface();

        const tables = await sequelize.query(
            `SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='latitude'`,
            { type: sequelize.constructor.QueryTypes.SELECT }
        );
        const tablesWithLat = tables.map(r => r.table_name);

        for (const table of ['patient_profiles', 'doctor_profiles']) {
            if (tablesWithLat.includes(table)) {
                console.log(`[${table}] Already has latitude — skipping.`);
                continue;
            }

            await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);`);
            await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);`);
            await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "locationUpdatedAt" TIMESTAMPTZ;`);
            console.log(`[${table}] ✅ Added latitude, longitude, locationUpdatedAt`);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
