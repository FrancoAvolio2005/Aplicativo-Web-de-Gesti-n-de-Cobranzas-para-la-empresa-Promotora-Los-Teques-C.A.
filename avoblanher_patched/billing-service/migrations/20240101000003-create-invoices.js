'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: {
        type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id:           { type: Sequelize.UUID, allowNull: false },
      company_id:        { type: Sequelize.UUID, allowNull: true },
      descripcion:       { type: Sequelize.TEXT, allowNull: true },
      monto_ves:         { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('pendiente', 'vencida', 'mora', 'pagada', 'anulada'),
        defaultValue: 'pendiente',
        allowNull: false,
      },
      fecha_emision:     { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
      fecha_vencimiento: { type: Sequelize.DATEONLY, allowNull: false },
      created_at:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('invoices');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_invoices_status;").catch(() => null);
  },
};
