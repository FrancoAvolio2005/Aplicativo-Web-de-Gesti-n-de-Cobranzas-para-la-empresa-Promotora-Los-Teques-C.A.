const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const UserModel = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('admin', 'supervisor', 'operador', 'cliente'),
    allowNull: false,
    defaultValue: 'operador',
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  cedula: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
  },
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: null,
  },
  // Campos para recuperación de contraseña
  reset_code: {
    type: DataTypes.STRING(6),
    allowNull: true,
    defaultValue: null,
  },
  reset_code_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['rol'] },
  ],
});

module.exports = UserModel;
