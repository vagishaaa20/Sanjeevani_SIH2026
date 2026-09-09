const sequelize = require('../config/db');

async function up() {
  try {
    console.log('Running UP migration: Removing Geography feature...');
    await sequelize.authenticateDatabase();
    
    // Remove legacy geographical columns from patient_profiles (No FK constraints exist on these in DB)
    await sequelize.query('ALTER TABLE IF EXISTS "patient_profiles" DROP COLUMN IF EXISTS "districtId";');
    await sequelize.query('ALTER TABLE IF EXISTS "patient_profiles" DROP COLUMN IF EXISTS "villageId";');
    await sequelize.query('ALTER TABLE IF EXISTS "patient_profiles" DROP COLUMN IF EXISTS "areaId";');

    // Remove legacy geographical columns from health_worker_profiles (No FK constraints exist on these in DB)
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_profiles" DROP COLUMN IF EXISTS "stateId";');
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_profiles" DROP COLUMN IF EXISTS "districtId";');
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_profiles" DROP COLUMN IF EXISTS "villageId";');
    await sequelize.query('ALTER TABLE IF EXISTS "health_worker_profiles" DROP COLUMN IF EXISTS "areaId";');

    // Drop tables safely in correct dependency order (without using broad CASCADE).
    // health_worker_coverages references districts, villages, areas, health_worker_profiles
    await sequelize.query('DROP TABLE IF EXISTS "health_worker_coverages";');
    // areas references villages
    await sequelize.query('DROP TABLE IF EXISTS "areas";');
    // villages references districts
    await sequelize.query('DROP TABLE IF EXISTS "villages";');
    // districts references states (though no strict FK was found, it is logically dependent)
    await sequelize.query('DROP TABLE IF EXISTS "districts";');
    // states has no dependencies
    await sequelize.query('DROP TABLE IF EXISTS "states";');

    // Drop the custom ENUM type used by health_worker_coverages
    await sequelize.query('DROP TYPE IF EXISTS "enum_health_worker_coverages_status";');

    console.log('UP migration complete: legacy geography safely removed.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

async function down() {
  try {
    console.log('Running DOWN migration: Restoring Geography feature schema...');
    await sequelize.authenticateDatabase();
    
    // 1. Recreate custom ENUM type
    await sequelize.query(`
        DO $$ BEGIN
            CREATE TYPE "enum_health_worker_coverages_status" AS ENUM('ACTIVE', 'INACTIVE');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `);

    // 2. Recreate tables in correct dependency order with exact schemas, primary keys, and foreign keys
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "states" (
            "id" UUID PRIMARY KEY,
            "name" VARCHAR(160) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
    `);

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "districts" (
            "id" UUID PRIMARY KEY,
            "stateId" UUID,
            "name" VARCHAR(160) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
    `);

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "villages" (
            "id" UUID PRIMARY KEY,
            "districtId" UUID NOT NULL REFERENCES "districts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
            "name" VARCHAR(160) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
    `);

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "areas" (
            "id" UUID PRIMARY KEY,
            "villageId" UUID NOT NULL REFERENCES "villages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
            "name" VARCHAR(160) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
    `);

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "health_worker_coverages" (
            "id" UUID PRIMARY KEY,
            "healthWorkerId" UUID NOT NULL REFERENCES "health_worker_profiles" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
            "districtId" UUID NOT NULL REFERENCES "districts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
            "villageId" UUID REFERENCES "villages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
            "areaId" UUID REFERENCES "areas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
            "status" "enum_health_worker_coverages_status" NOT NULL DEFAULT 'ACTIVE',
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
    `);

    // 3. Add columns back to profile tables
    await sequelize.query('ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "districtId" UUID;');
    await sequelize.query('ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "villageId" UUID;');
    await sequelize.query('ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "areaId" UUID;');

    await sequelize.query('ALTER TABLE "health_worker_profiles" ADD COLUMN IF NOT EXISTS "stateId" UUID;');
    await sequelize.query('ALTER TABLE "health_worker_profiles" ADD COLUMN IF NOT EXISTS "districtId" UUID;');
    await sequelize.query('ALTER TABLE "health_worker_profiles" ADD COLUMN IF NOT EXISTS "villageId" UUID;');
    await sequelize.query('ALTER TABLE "health_worker_profiles" ADD COLUMN IF NOT EXISTS "areaId" UUID;');

    console.log('DOWN migration complete: Geography tables and columns restored perfectly.');
  } catch (error) {
    console.error('Rollback failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

const isDown = process.argv.includes('--down');
if (isDown) {
  down();
} else {
  up();
}
