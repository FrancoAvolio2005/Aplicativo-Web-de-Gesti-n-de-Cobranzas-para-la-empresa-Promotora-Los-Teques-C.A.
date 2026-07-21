'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'hora_pago', {
      type: Sequelize.TIME,
      allowNull: true,
    });
    await queryInterface.addColumn('payments', 'registrado_por_admin', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('payments', 'hora_pago');
    await queryInterface.removeColumn('payments', 'registrado_por_admin');
  }
};
