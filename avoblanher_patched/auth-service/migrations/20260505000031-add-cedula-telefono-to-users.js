'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'cedula', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('users', 'telefono', {
      type: Sequelize.STRING(30),
      allowNull: true,
      defaultValue: null,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'cedula');
    await queryInterface.removeColumn('users', 'telefono');
  }
};
