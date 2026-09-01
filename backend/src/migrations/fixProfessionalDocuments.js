/**
 * Migration: Fix professional_documents schema drift.
 *
 * Problems fixed:
 *   1. `uploadedAt` column exists in the Sequelize model (allowNull: false)
 *      but is MISSING from the DB — causes INSERT to fail on doctor registration.
 *   2. `ownerRole` column exists in the DB but not declared in the model
 *      (harmless for reads, but documents this discrepancy).
 *
 * Run with:  node src/migrations/fixProfessionalDocuments.js
 */
require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // 1. Add uploadedAt if missing
        const [colCheck] = await sequelize.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='professional_documents' AND column_name='uploadedAt'"
        );

        if (colCheck.length === 0) {
            await sequelize.query(
                `ALTER TABLE "professional_documents" ADD COLUMN IF NOT EXISTS "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`
            );
            console.log('[professional_documents] ✅ Added uploadedAt column');
        } else {
            console.log('[professional_documents] uploadedAt already exists — skipping');
        }

        // 2. Log ownerRole status (it exists in DB but not in current model — safe to leave for now)
        const [ownerRoleCheck] = await sequelize.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='professional_documents' AND column_name='ownerRole'"
        );
        if (ownerRoleCheck.length > 0) {
            console.log('[professional_documents] ownerRole column detected in DB (not in model — will be synced by model update)');
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
