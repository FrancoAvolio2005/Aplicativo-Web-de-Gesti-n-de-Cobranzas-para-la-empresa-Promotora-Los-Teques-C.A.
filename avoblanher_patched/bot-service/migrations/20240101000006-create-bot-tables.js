'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryInterface.createTable('exchange_rates', {
      id:     { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      tasa:   { type: Sequelize.DECIMAL(12, 4), allowNull: false },
      fuente: { type: Sequelize.ENUM('BCV','DolarToday','Manual'), defaultValue: 'BCV', allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.createTable('notifications', {
      id:           { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      factura_id:   { type: Sequelize.UUID, allowNull: false },
      user_id:   { type: Sequelize.UUID, allowNull: false },
      destinatario: { type: Sequelize.STRING(255), allowNull: false },
      asunto:       { type: Sequelize.STRING(255), allowNull: true },
      estado:       { type: Sequelize.ENUM('enviado','fallido','pendiente'), defaultValue: 'pendiente', allowNull: false },
      error_detalle:{ type: Sequelize.TEXT, allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['estado']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('exchange_rates');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_notifications_estado\";");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_exchange_rates_fuente\";");
  }
};
