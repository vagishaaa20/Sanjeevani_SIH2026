'use strict';

/**
 * Migration to enforce data privacy on the Disease Reports table.
 * Strips exact GPS coordination (latitude/longitude) leaving only the roughly 5km anonymized `geohash`.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('disease_reports');

        if (tableInfo.latitude) {
            await queryInterface.removeColumn('disease_reports', 'latitude');
        }

        if (tableInfo.longitude) {
            await queryInterface.removeColumn('disease_reports', 'longitude');
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('disease_reports', 'latitude', {
            type: Sequelize.DECIMAL(10, 8),
            allowNull: true,
        });
        await queryInterface.addColumn('disease_reports', 'longitude', {
            type: Sequelize.DECIMAL(11, 8),
            allowNull: true,
        });
    }
};
