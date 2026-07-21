const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ExchangeRateModel = sequelize.define('ExchangeRate', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tasa: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
  fuente: { type: DataTypes.ENUM('BCV', 'DolarToday', 'Manual'), defaultValue: 'BCV', allowNull: false },
}, {
  tableName: 'exchange_rates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ExchangeRateModel;
