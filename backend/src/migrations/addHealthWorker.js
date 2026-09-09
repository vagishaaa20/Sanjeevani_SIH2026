const sequelize = require('../config/db');
require('../models');

async function run() {
  try {
    await sequelize.authenticateDatabase();
    await sequelize.query('ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS \'health_worker\';');
    await sequelize.query('ALTER TABLE IF EXISTS "districts" ADD COLUMN IF NOT EXISTS "stateId" UUID;');
    await sequelize.query('ALTER TABLE IF EXISTS "patient_profiles" ADD COLUMN IF NOT EXISTS "districtId" UUID;');
    await sequelize.query('ALTER TABLE IF EXISTS "patient_profiles" ADD COLUMN IF NOT EXISTS "villageId" UUID;');
    await sequelize.query('ALTER TABLE IF EXISTS "patient_profiles" ADD COLUMN IF NOT EXISTS "areaId" UUID;');
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_profiles" ADD COLUMN IF NOT EXISTS "stateId" UUID;');
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_profiles" ADD COLUMN IF NOT EXISTS "districtId" UUID;');
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_profiles" ADD COLUMN IF NOT EXISTS "villageId" UUID;');
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_profiles" ADD COLUMN IF NOT EXISTS "areaId" UUID;');
    await sequelize.query('DROP INDEX IF EXISTS "health_worker_coverages_health_worker_id_district_id_village_id";');
    await sequelize.query('DROP INDEX IF EXISTS "health_worker_coverages_healthWorkerId_districtId_villageId_areaId";');
    await sequelize.sync();
    await sequelize.query('CREATE INDEX IF NOT EXISTS "districts_state_id" ON "districts" ("stateId");');
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_assignments" DROP CONSTRAINT IF EXISTS "health_worker_assignments_active_unique";');
    await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS "health_worker_assignments_active_unique" ON "health_worker_assignments" ("healthWorkerId", "patientId") WHERE "status" = 'ACTIVE';`);
    await sequelize.query('CREATE INDEX IF NOT EXISTS "health_worker_followups_worker_status_date" ON "health_worker_followups" ("healthWorkerId", "status", "followUpDate");');
    console.log('Health Worker role and constraints updated. Start the server once to create new tables with sequelize.sync().');
  } catch (error) {
    console.error('Health Worker migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();