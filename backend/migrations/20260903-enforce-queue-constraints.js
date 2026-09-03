'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add CANCELLED enum
        try {
            await queryInterface.sequelize.query(`ALTER TYPE "enum_queues_status" ADD VALUE IF NOT EXISTS 'CANCELLED'`);
        } catch (e) {
            if (!e.message.includes('already exists') && !e.message.includes('syntax error')) {
                console.warn('Enum addition failed, continuing...', e);
            }
        }

        // 2. Add partial unique index
        try {
            await queryInterface.addIndex('queues', ['patientId'], {
                unique: true,
                name: 'one_active_queue_per_patient',
                where: {
                    status: ['WAITING', 'SERVING']
                }
            });
        } catch (e) {
            if (!e.message.includes('already exists')) throw e;
        }
    },

    down: async (queryInterface, Sequelize) => {
        try {
            await queryInterface.removeIndex('queues', 'one_active_queue_per_patient');
        } catch (e) { }
        // Note: Postgres does not support natively dropping individual ENUM values easily.
    }
};
