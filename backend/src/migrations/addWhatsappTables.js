/**
 * Migration: Create WhatsApp integration tables.
 *
 * Tables created:
 *   1. `whatsapp_logs`    — audit trail for every inbound and outbound WA message
 *   2. `whatsapp_sessions` — per-phone bot conversation state
 *
 * Run with:  node src/migrations/addWhatsappTables.js
 */
require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // ── 1. whatsapp_logs ──────────────────────────────────────────────────
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "whatsapp_logs" (
                "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
                "phone"        VARCHAR(30)   NOT NULL,
                "direction"    VARCHAR(10)   NOT NULL CHECK ("direction" IN ('inbound', 'outbound')),
                "message_type" VARCHAR(20)   NOT NULL CHECK ("message_type" IN ('text', 'template', 'location', 'interactive')),
                "message"      TEXT,
                "wa_message_id" VARCHAR(128) UNIQUE,
                "status"       VARCHAR(20)   NOT NULL DEFAULT 'sent',
                "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                PRIMARY KEY ("id")
            );
        `);
        console.log('[whatsapp_logs] ✅ Table ensured');

        // Index for fast dedup lookup on wa_message_id
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "idx_wl_wa_message_id"
            ON "whatsapp_logs" ("wa_message_id")
            WHERE "wa_message_id" IS NOT NULL;
        `);
        console.log('[whatsapp_logs] ✅ Index on wa_message_id ensured');

        // ── 2. whatsapp_sessions ──────────────────────────────────────────────
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "whatsapp_sessions" (
                "phone"         VARCHAR(30)  NOT NULL,
                "current_step"  VARCHAR(50)  NOT NULL DEFAULT 'idle',
                "context"       JSONB        NOT NULL DEFAULT '{}',
                "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                PRIMARY KEY ("phone")
            );
        `);
        console.log('[whatsapp_sessions] ✅ Table ensured');

        console.log('✅ WhatsApp migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
