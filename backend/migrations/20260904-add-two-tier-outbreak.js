'use strict';

/**
 * Migration for Two-Tier Outbreak Signal
 * - Adds confidenceLevel, consultationId, doctorId to disease_reports
 * - Adds reportedCount, confirmedCount to outbreak_alerts and removes caseCount
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // --- disease_reports ---
        await queryInterface.addColumn('disease_reports', 'confidence_level', {
            type: Sequelize.ENUM('reported', 'confirmed'),
            allowNull: false,
            defaultValue: 'reported',
        });

        await queryInterface.addColumn('disease_reports', 'consultation_id', {
            type: Sequelize.UUID,
            allowNull: true,
        });

        await queryInterface.addColumn('disease_reports', 'doctor_id', {
            type: Sequelize.UUID,
            allowNull: true,
        });

        // --- outbreak_alerts ---
        await queryInterface.addColumn('outbreak_alerts', 'reported_count', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        await queryInterface.addColumn('outbreak_alerts', 'confirmed_count', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        const tableInfo = await queryInterface.describeTable('outbreak_alerts');
        if (tableInfo.case_count) {
            await queryInterface.removeColumn('outbreak_alerts', 'case_count');
        }
    },

    down: async (queryInterface, Sequelize) => {
        // --- outbreak_alerts ---
        await queryInterface.addColumn('outbreak_alerts', 'case_count', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });
        await queryInterface.removeColumn('outbreak_alerts', 'reported_count');
        await queryInterface.removeColumn('outbreak_alerts', 'confirmed_count');

        // --- disease_reports ---
        await queryInterface.removeColumn('disease_reports', 'confidence_level');
        // Removing ENUM types in Postgres requires explicit DROP TYPE if needed, but removeColumn drops the usage.
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_disease_reports_confidence_level" CASCADE;').catch(() => { });

        await queryInterface.removeColumn('disease_reports', 'consultation_id');
        await queryInterface.removeColumn('disease_reports', 'doctor_id');
    }
};
