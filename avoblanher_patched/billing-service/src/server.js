require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./infrastructure/database/connection');
const logger = require('./infrastructure/logger/logger');

const PORT = process.env.PORT || 3002;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('✅ billing-service conectado a PostgreSQL');
    app.listen(PORT, () => logger.info(`🚀 billing-service corriendo en puerto ${PORT}`));
  } catch (e) {
    logger.error('❌ Error de conexión:', e);
    process.exit(1);
  }
}
start();
