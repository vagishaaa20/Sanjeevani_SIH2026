/**
 * Migration: create disease_reports table
 * Run: node src/migrations/addDiseaseReports.js
 */
require('../config/env');
const sequelize = require('../config/db');

async function up() {
    await sequelize.authenticateDatabase();

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS disease_reports (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id      UUID,
            disease_category VARCHAR(100) NOT NULL,
            symptom_tags    TEXT[] NOT NULL DEFAULT '{}',
            latitude        DECIMAL(10,8),
            longitude       DECIMAL(11,8),
            geohash         VARCHAR(10),
            reported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            source          VARCHAR(20) NOT NULL DEFAULT 'triage'
                            CHECK (source IN ('triage','manual')),
            severity_score  SMALLINT NOT NULL DEFAULT 1
                            CHECK (severity_score BETWEEN 1 AND 3),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    // Composite index for fast aggregation window queries
    await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_disease_reports_geohash_cat_at
        ON disease_reports (geohash, disease_category, reported_at DESC);
    `);

    console.log('✅  disease_reports table and index created');
    await sequelize.close();
}

up().catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
