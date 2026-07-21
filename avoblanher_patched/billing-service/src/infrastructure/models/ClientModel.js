const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ClientModel = sequelize.define('Client', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  cedula: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  telefono: { type: DataTypes.STRING(20), allowNull: true },
  direccion: { type: DataTypes.TEXT, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ClientModel;
