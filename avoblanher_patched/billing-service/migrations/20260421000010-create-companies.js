'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Asegurarse de que la tabla companies tenga user_id (no client_id)
    await queryInterface.createTable('companies', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      rif:       { type: Sequelize.STRING(30), allowNull: false, unique: true },
      nombre:    { type: Sequelize.STRING(200), allowNull: false },
      direccion: { type: Sequelize.TEXT, allowNull: true },
      user_id:   { type: Sequelize.UUID, allowNull: false },   // FK logical a users (auth-service)
      activo:    { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:{ type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:{ type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    }).catch(() => null); // tabla puede ya existir

    // 2. Agregar columna company_id a invoices si no existe
    const invCols = await queryInterface.describeTable('invoices').catch(() => null);
    if (invCols && !invCols.company_id) {
      await queryInterface.addColumn('invoices', 'company_id', {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'companies', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    // 3. Agregar columna user_id a invoices si no existe (reemplaza cliente_id)
    if (invCols && !invCols.user_id) {
      await queryInterface.addColumn('invoices', 'user_id', {
        type: Sequelize.UUID, allowNull: true,  // null temporal para migración
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('invoices', 'company_id').catch(() => null);
    await queryInterface.removeColumn('invoices', 'user_id').catch(() => null);
    await queryInterface.dropTable('companies').catch(() => null);
  },
};
