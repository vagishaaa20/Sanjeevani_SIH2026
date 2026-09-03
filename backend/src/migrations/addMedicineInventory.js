/**
 * Ensures the medicine inventory schema and clinic-scoped uniqueness.
 * Run with: node src/migrations/addMedicineInventory.js
 */
require('../config/env');
const sequelize = require('../config/db');

async function migrate() {
    const transaction = await sequelize.transaction();

    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "medicine_inventory" (
                "medicineId" UUID NOT NULL DEFAULT gen_random_uuid(),
                "clinicId" UUID NOT NULL,
                "medicineName" VARCHAR(200) NOT NULL,
                "genericName" VARCHAR(200),
                "quantity" INTEGER NOT NULL DEFAULT 0 CHECK ("quantity" >= 0),
                "unit" VARCHAR(50) DEFAULT 'pcs',
                "lowStockThreshold" INTEGER NOT NULL DEFAULT 10 CHECK ("lowStockThreshold" >= 0),
                "isAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
                "lastUpdated" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY ("medicineId")
            );
        `, { transaction });

        await sequelize.query(`
            DO $$
            BEGIN
                                IF NOT EXISTS (
                                        SELECT 1
                                        FROM information_schema.key_column_usage kcu
                                        JOIN information_schema.constraint_column_usage ccu
                                            ON kcu.constraint_name = ccu.constraint_name
                                        WHERE kcu.table_name = 'medicine_inventory'
                                            AND kcu.column_name = 'clinicId'
                                            AND ccu.table_name = 'clinic_profiles'
                                            AND ccu.column_name = 'userId'
                                ) THEN
                    ALTER TABLE "medicine_inventory"
                    ADD CONSTRAINT "medicine_inventory_clinic_fk"
                    FOREIGN KEY ("clinicId") REFERENCES "clinic_profiles" ("userId")
                    ON UPDATE CASCADE ON DELETE CASCADE;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'medicine_inventory_clinic_fk'
                ) AND EXISTS (
                    SELECT 1
                    FROM information_schema.table_constraints
                    WHERE table_name = 'medicine_inventory'
                      AND constraint_type = 'FOREIGN KEY'
                      AND constraint_name <> 'medicine_inventory_clinic_fk'
                ) THEN
                    ALTER TABLE "medicine_inventory" DROP CONSTRAINT "medicine_inventory_clinic_fk";
                END IF;
            END $$;
        `, { transaction });

        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "medicine_inventory_clinic_id_idx"
            ON "medicine_inventory" ("clinicId");
        `, { transaction });

        await sequelize.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'medicine_inventory_clinic_id')
                   AND EXISTS (SELECT 1 FROM pg_class WHERE relname = 'medicine_inventory_clinic_id_idx') THEN
                    DROP INDEX "medicine_inventory_clinic_id_idx";
                END IF;
            END $$;
        `, { transaction });

        await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "medicine_inventory_clinic_name_unique"
            ON "medicine_inventory" ("clinicId", LOWER("medicineName"));
        `, { transaction });

        await transaction.commit();
        console.log('Medicine inventory migration complete.');
    } catch (error) {
        await transaction.rollback();
        console.error('Medicine inventory migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

migrate();
