'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'reset_code', {
      type: Sequelize.STRING(6),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('users', 'reset_code_expires', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'reset_code');
    await queryInterface.removeColumn('users', 'reset_code_expires');
  },
};
