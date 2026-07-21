const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const InvoiceModel  = require('./InvoiceModel');

const PaymentModel = sequelize.define('Payment', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  factura_id:      { type: DataTypes.UUID, allowNull: false },
  monto_ves:       { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  monto_original:  { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  moneda_original: { type: DataTypes.ENUM('VES', 'USD'), defaultValue: 'VES' },
  tasa_bcv:        { type: DataTypes.DECIMAL(10, 4), allowNull: true },
  metodo_pago: {
    type: DataTypes.ENUM('transferencia', 'pago_movil', 'zelle', 'efectivo'),
    allowNull: false,
  },
  referencia:           { type: DataTypes.STRING(100), allowNull: true },
  concepto:             { type: DataTypes.TEXT, allowNull: true },
  comprobante_url:      { type: DataTypes.TEXT, allowNull: true },
  fecha_pago:           { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  hora_pago:            { type: DataTypes.TIME, allowNull: true },        // Cambio #3
  registrado_por_admin: { type: DataTypes.BOOLEAN, defaultValue: false }, // Cambio #5
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

PaymentModel.belongsTo(InvoiceModel, { foreignKey: 'factura_id', as: 'factura' });
InvoiceModel.hasMany(PaymentModel,   { foreignKey: 'factura_id', as: 'pagos' });

// Asociación InvoiceModel ↔ CompanyModel
const CompanyModel = require('./CompanyModel');
InvoiceModel.belongsTo(CompanyModel, { foreignKey: 'company_id', as: 'empresa' });
CompanyModel.hasMany(InvoiceModel,   { foreignKey: 'company_id', as: 'facturas' });

module.exports = PaymentModel;
