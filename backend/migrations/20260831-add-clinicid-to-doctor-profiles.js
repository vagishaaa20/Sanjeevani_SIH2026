'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor_profiles', 'clinic_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'clinic_profiles', // Target table
        key: 'userId',           // Target primary/foreign key
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('doctor_profiles', 'clinic_id');
  }
};