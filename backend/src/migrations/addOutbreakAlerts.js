/**
 * Migration: create outbreak_alerts table
 * Run: node src/migrations/addOutbreakAlerts.js
 */
require('../config/env');
const sequelize = require('../config/db');

async function up() {
    await sequelize.authenticateDatabase();

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS outbreak_alerts (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            geohash              VARCHAR(10) NOT NULL,
            disease_category     VARCHAR(100) NOT NULL,
            case_count           INTEGER NOT NULL DEFAULT 0,
            threshold_breached_at TIMESTAMPTZ,
            risk_level           VARCHAR(20) NOT NULL DEFAULT 'watch'
                                 CHECK (risk_level IN ('watch','moderate','severe')),
            center_lat           DECIMAL(10,8),
            center_lng           DECIMAL(11,8),
            radius_km            DECIMAL(6,2) NOT NULL DEFAULT 10,
            is_active            BOOLEAN NOT NULL DEFAULT TRUE,
            resolved_at          TIMESTAMPTZ,
            notified_at          TIMESTAMPTZ,
            created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (geohash, disease_category)
        );
    `);

    await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_outbreak_alerts_active
        ON outbreak_alerts (is_active, risk_level, created_at DESC);
    `);

    console.log('✅  outbreak_alerts table and index created');
    await sequelize.close();
}

up().catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
