const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const RiskClassificationModel = sequelize.define('RiskClassification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  nivel_riesgo: { type: DataTypes.ENUM('bajo', 'medio', 'alto'), allowNull: false },
  probabilidad_bajo: { type: DataTypes.DECIMAL(5, 4), allowNull: false },
  probabilidad_medio: { type: DataTypes.DECIMAL(5, 4), allowNull: false },
  probabilidad_alto: { type: DataTypes.DECIMAL(5, 4), allowNull: false },
  promedio_retraso: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  tasa_cumplimiento: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
  promedio_cobertura: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
  frecuencia_efectivo: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
  cantidad_registros: { type: DataTypes.INTEGER, allowNull: true },
  recomendacion: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'risk_classifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = RiskClassificationModel;
