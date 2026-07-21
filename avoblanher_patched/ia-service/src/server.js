require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./infrastructure/database/connection');
const logger = require('./infrastructure/logger/logger');
const PORT = process.env.PORT || 3003;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('✅ ia-service conectado a PostgreSQL');
    app.listen(PORT, () => logger.info(`🚀 ia-service corriendo en puerto ${PORT}`));
  } catch (e) { logger.error('❌ Error:', e); process.exit(1); }
}
start();
