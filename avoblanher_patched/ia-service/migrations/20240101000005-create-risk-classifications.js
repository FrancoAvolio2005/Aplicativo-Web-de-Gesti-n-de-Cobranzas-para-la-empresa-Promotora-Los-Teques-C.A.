'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryInterface.createTable('risk_classifications', {
      id:                  { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      user_id:             { type: Sequelize.UUID, allowNull: false },   // FK a users (auth-service)
      nivel_riesgo:        { type: Sequelize.ENUM('bajo','medio','alto'), allowNull: false },
      probabilidad_bajo:   { type: Sequelize.DECIMAL(5,4), allowNull: false },
      probabilidad_medio:  { type: Sequelize.DECIMAL(5,4), allowNull: false },
      probabilidad_alto:   { type: Sequelize.DECIMAL(5,4), allowNull: false },
      promedio_retraso:    { type: Sequelize.DECIMAL(5,2), allowNull: true },
      tasa_cumplimiento:   { type: Sequelize.DECIMAL(5,4), allowNull: true },
      promedio_cobertura:  { type: Sequelize.DECIMAL(5,4), allowNull: true },
      frecuencia_efectivo: { type: Sequelize.DECIMAL(5,4), allowNull: true },
      cantidad_registros:  { type: Sequelize.INTEGER, allowNull: true },
      recomendacion:       { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('risk_classifications', ['user_id']);
    await queryInterface.addIndex('risk_classifications', ['nivel_riesgo']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('risk_classifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_risk_classifications_nivel_riesgo";');
  },
};
