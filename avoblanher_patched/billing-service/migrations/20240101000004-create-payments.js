'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      factura_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'invoices', key: 'id' }, onDelete: 'CASCADE' },
      monto_ves: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      monto_original: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      moneda_original: { type: Sequelize.ENUM('VES','USD'), defaultValue: 'VES' },
      tasa_bcv: { type: Sequelize.DECIMAL(10, 4), allowNull: true },
      metodo_pago: { type: Sequelize.ENUM('transferencia','pago_movil','zelle','efectivo'), allowNull: false },
      referencia: { type: Sequelize.STRING(100), allowNull: true },
      comprobante_url: { type: Sequelize.TEXT, allowNull: true },
      fecha_pago: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_DATE') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('payments', ['factura_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_payments_moneda_original\";");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_payments_metodo_pago\";");
  }
};
