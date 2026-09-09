/**
 * Migration: Add blockchain prescription verification columns to consultations.
 *
 * Columns added:
 *   - prescription_hash   VARCHAR(66)  – SHA-256 of canonical fields (0x-prefixed)
 *   - blockchain_tx_hash  VARCHAR(66)  – Polygon Amoy tx hash after anchoring
 *   - contract_address    VARCHAR(42)  – PrescriptionAnchor contract address
 *
 * Run with:  node src/migrations/addPrescriptionBlockchainFields.js
 */
require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const cols = [
            ['prescription_hash', 'VARCHAR(66)'],
            ['blockchain_tx_hash', 'VARCHAR(66)'],
            ['contract_address', 'VARCHAR(42)'],
        ];

        for (const [col, type] of cols) {
            const [existing] = await sequelize.query(
                `SELECT column_name FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='consultations' AND column_name='${col}'`
            );
            if (existing.length === 0) {
                await sequelize.query(`ALTER TABLE "consultations" ADD COLUMN "${col}" ${type}`);
                console.log(`[consultations] ✅ Added ${col}`);
            } else {
                console.log(`[consultations] ${col} already exists — skipping`);
            }
        }

        console.log('✅ Prescription blockchain migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
