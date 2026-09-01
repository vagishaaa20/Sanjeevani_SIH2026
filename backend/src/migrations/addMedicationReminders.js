/**
 * Migration: Create medication_reminders and medication_log tables.
 *
 * Run with:  node src/migrations/addMedicationReminders.js
 */
require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // ── medication_reminders ──────────────────────────────────────────────
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "medication_reminders" (
                "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
                "patient_id"       UUID         NOT NULL,
                "consultation_id"  UUID,
                "medicine_name"    VARCHAR(200) NOT NULL,
                "dosage"           VARCHAR(100),
                "frequency"        VARCHAR(50)  NOT NULL DEFAULT 'once_daily',
                "start_date"       DATE,
                "end_date"         DATE,
                "reminder_times"   JSONB        NOT NULL DEFAULT '["09:00"]',
                "is_active"        BOOLEAN      NOT NULL DEFAULT FALSE,
                "bull_job_ids"     JSONB        NOT NULL DEFAULT '[]',
                "extracted_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                "confirmed_at"     TIMESTAMPTZ,
                "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                PRIMARY KEY ("id")
            );
        `);
        console.log('[medication_reminders] ✅ Table ensured');

        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "idx_mr_patient_id"
            ON "medication_reminders" ("patient_id");
        `);
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "idx_mr_consultation_id"
            ON "medication_reminders" ("consultation_id")
            WHERE "consultation_id" IS NOT NULL;
        `);
        console.log('[medication_reminders] ✅ Indexes ensured');

        // ── medication_log ────────────────────────────────────────────────────
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "medication_log" (
                "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
                "reminder_id" UUID        NOT NULL,
                "date"        DATE        NOT NULL,
                "time"        VARCHAR(5)  NOT NULL,
                "status"      VARCHAR(10) NOT NULL DEFAULT 'upcoming'
                              CHECK ("status" IN ('taken', 'missed', 'upcoming')),
                "logged_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY ("id"),
                UNIQUE ("reminder_id", "date", "time")
            );
        `);
        console.log('[medication_log] ✅ Table ensured');

        console.log('✅ Medication reminders migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
