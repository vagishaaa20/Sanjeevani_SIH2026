'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // PostgreSQL specific logic to add a new ENUM value securely inside a transaction
        // 'disconnected' needs to be added to BOTH the status enum and webrtcStatus enum.

        // Enums usually have a generated name like "enum_Consultations_status" and "enum_Consultations_webrtcStatus"

        try {
            await queryInterface.sequelize.query(`
            ALTER TYPE "enum_Consultations_status" ADD VALUE IF NOT EXISTS 'disconnected';
        `);
        } catch (e) {
            console.log('Skipping adding ENUM value for status, already exists or type missing', e.message);
        }

        try {
            await queryInterface.sequelize.query(`
            ALTER TYPE "enum_Consultations_webrtcStatus" ADD VALUE IF NOT EXISTS 'disconnected';
        `);
        } catch (e) {
            console.log('Skipping adding ENUM value for webrtcStatus, already exists or type missing', e.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Note: removing values from Postgres ENUMs is quite complex and generally not possible directly
        // This is a one-way migration for addition
        console.log('Down migration not supported for PostgreSQL ENUM additions directly.');
    }
};
