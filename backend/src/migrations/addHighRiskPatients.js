require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticateDatabase();

        await sequelize.query(`
            CREATE TYPE enum_high_risk_patients_risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
            CREATE TYPE enum_high_risk_patients_status AS ENUM ('IDENTIFIED', 'MONITORING', 'ESCALATED', 'REFERRED', 'RESOLVED');

            CREATE TABLE IF NOT EXISTS "high_risk_patients" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "patient_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "risk_level" enum_high_risk_patients_risk_level NOT NULL DEFAULT 'HIGH',
                "risk_reason" TEXT,
                "status" enum_high_risk_patients_status NOT NULL DEFAULT 'IDENTIFIED',
                "assigned_health_worker_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
                "assigned_doctor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
                "escalation_reason" TEXT,
                "next_followup_at" DATE,
                "last_followup_at" DATE,
                "identified_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "resolved_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_high_risk_patient_id ON "high_risk_patients"("patient_id");
            CREATE INDEX idx_high_risk_status ON "high_risk_patients"("status");
            CREATE INDEX idx_high_risk_hw_id ON "high_risk_patients"("assigned_health_worker_id");
            CREATE INDEX idx_high_risk_dr_id ON "high_risk_patients"("assigned_doctor_id");
        `);
        console.log('✅ high_risk_patients table created');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sequelize.close();
    }
}

migrate();
