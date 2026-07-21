const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const InvoiceModel = sequelize.define('Invoice', {
  id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:           { type: DataTypes.UUID, allowNull: false },
  company_id:        { type: DataTypes.UUID, allowNull: true },
  descripcion:       { type: DataTypes.TEXT, allowNull: true },
  monto_ves:         { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('pendiente', 'vencida', 'mora', 'pagada', 'anulada'),
    defaultValue: 'pendiente',
    allowNull: false,
  },
  fecha_emision:     { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  tableName: 'invoices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = InvoiceModel;
