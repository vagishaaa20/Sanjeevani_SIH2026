const sequelize = require('./src/config/db');

async function migrateAppointments() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('appointments').catch(() => null);

        if (!tableInfo) {
            console.log('Creating appointments table via sync...');
            await sequelize.sync({ alter: true });
            console.log('Appointments table created/synced successfully.');
            process.exit(0);
        }

        const columns = [
            { name: 'timeSlot', sql: 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "timeSlot" VARCHAR(100);' },
            { name: 'type', sql: 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "type" VARCHAR(50) DEFAULT \'clinic_visit\';' },
            { name: 'symptoms', sql: 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "symptoms" TEXT;' },
            { name: 'notes', sql: 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "notes" TEXT;' },
            { name: 'tokenNumber', sql: 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "tokenNumber" INTEGER;' }
        ];

        for (const col of columns) {
            console.log(`Ensuring column: ${col.name}`);
            await sequelize.query(col.sql);
        }

        console.log('Appointments columns migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrateAppointments();
