require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticateDatabase();

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "consultation_documents" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "consultationId" UUID NOT NULL,
                "patientId" UUID NOT NULL,
                "fileUrl" TEXT NOT NULL,
                "documentType" VARCHAR(255) DEFAULT 'other' NOT NULL,
                "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ consultation_documents table created');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sequelize.close();
    }
}

migrate();
