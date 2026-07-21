const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CompanyModel = sequelize.define('Company', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  rif:       { type: DataTypes.STRING(30), allowNull: false, unique: true },
  nombre:    { type: DataTypes.STRING(200), allowNull: false },
  direccion: { type: DataTypes.TEXT, allowNull: true },
  user_id:   { type: DataTypes.UUID, allowNull: false },   // FK a users (auth-service)
  activo:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompanyModel;
