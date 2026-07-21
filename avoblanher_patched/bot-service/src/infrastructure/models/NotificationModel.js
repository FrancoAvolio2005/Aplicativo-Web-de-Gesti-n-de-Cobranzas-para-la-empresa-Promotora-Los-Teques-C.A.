const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const NotificationModel = sequelize.define('Notification', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  factura_id:    { type: DataTypes.UUID, allowNull: false },
  user_id:       { type: DataTypes.UUID, allowNull: false },   // FK lógica a users (auth-service)
  destinatario:  { type: DataTypes.STRING(255), allowNull: false },
  asunto:        { type: DataTypes.STRING(255), allowNull: true },
  estado: {
    type: DataTypes.ENUM('enviado', 'fallido', 'pendiente'),
    defaultValue: 'pendiente',
    allowNull: false,
  },
  error_detalle: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = NotificationModel;
