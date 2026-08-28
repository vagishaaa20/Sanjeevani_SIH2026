'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Enable the PostGIS extension (idempotent — safe to run every deploy)
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // 2. Add a geography(Point, 4326) column — SRID 4326 = standard WGS84 lat/lng
    await queryInterface.sequelize.query(`
      ALTER TABLE "DoctorProfiles"
      ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
    `);

    // 3. Backfill from existing latitude/longitude columns
    await queryInterface.sequelize.query(`
      UPDATE "DoctorProfiles"
      SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    `);

    // 4. GIST index — the actual performance win over the raw Haversine literal
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS doctor_profiles_location_gist
      ON "DoctorProfiles" USING GIST (location);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS doctor_profiles_location_gist;`);
    await queryInterface.sequelize.query(`ALTER TABLE "DoctorProfiles" DROP COLUMN IF EXISTS location;`);
  }
};