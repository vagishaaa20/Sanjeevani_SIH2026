require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB for verification_documents migration.');

        // Create ENUM type for status if not exists
        await sequelize.query(`
            DO $$ BEGIN
                CREATE TYPE "enum_verification_documents_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create verification_documents table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "verification_documents" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "role" VARCHAR(50) NOT NULL,
                "document_type" VARCHAR(100) NOT NULL,
                "file_name" VARCHAR(255) NOT NULL,
                "storage_path" VARCHAR(500) NOT NULL,
                "mime_type" VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
                "file_size" INTEGER NOT NULL,
                "status" "enum_verification_documents_status" NOT NULL DEFAULT 'PENDING',
                "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "reviewed_at" TIMESTAMPTZ,
                "reviewed_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
                "rejection_reason" TEXT,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        console.log('✅ verification_documents table verified / created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
