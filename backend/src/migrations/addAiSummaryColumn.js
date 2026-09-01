/**
 * Migration: Add AI summary + prescription text columns to consultations.
 *
 * Columns added:
 *   - ai_summary              TEXT   — cached Gemini plain-language summary
 *   - ai_summary_generated_at TIMESTAMPTZ — used to detect stale cache
 *   - reported_symptoms       TEXT   — patient-reported symptoms at time of booking
 *   - prescription_text       TEXT   — raw prescription text for extraction
 *
 * Run with:  node src/migrations/addAiSummaryColumn.js
 */
require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const cols = [
            [`ai_summary`, `TEXT`],
            [`ai_summary_generated_at`, `TIMESTAMPTZ`],
            [`reported_symptoms`, `TEXT`],
            [`prescription_text`, `TEXT`],
        ];

        for (const [col, type] of cols) {
            const [existing] = await sequelize.query(
                `SELECT column_name FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='consultations' AND column_name='${col}'`
            );
            if (existing.length === 0) {
                await sequelize.query(
                    `ALTER TABLE "consultations" ADD COLUMN "${col}" ${type}`
                );
                console.log(`[consultations] ✅ Added ${col}`);
            } else {
                console.log(`[consultations] ${col} already exists — skipping`);
            }
        }

        console.log('✅ AI summary migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
