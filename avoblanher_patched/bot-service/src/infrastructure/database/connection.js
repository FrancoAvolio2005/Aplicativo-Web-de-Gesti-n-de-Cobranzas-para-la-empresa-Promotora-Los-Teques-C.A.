const { Sequelize } = require('sequelize');
const config = require('./config');
const cfg = config[process.env.NODE_ENV || 'development'];
const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, {
  host: cfg.host, port: cfg.port, dialect: 'postgres', logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});
module.exports = { sequelize };
