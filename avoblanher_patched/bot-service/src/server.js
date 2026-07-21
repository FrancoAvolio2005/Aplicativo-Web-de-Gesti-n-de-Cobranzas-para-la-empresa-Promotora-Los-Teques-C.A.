require('dotenv').config();
const app          = require('./app');
const { sequelize }= require('./infrastructure/database/connection');
const logger       = require('./infrastructure/logger/logger');
const bcvAgent     = require('./application/services/BCVSyncAgent');
const notifAgent   = require('./application/services/NotificationAgent');

const PORT = process.env.PORT || 3004;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('✅ bot-service conectado a PostgreSQL');

    // Iniciar agentes autónomos
    bcvAgent.start();
    notifAgent.start();

    app.listen(PORT, () => logger.info(`🚀 bot-service corriendo en puerto ${PORT}`));
  } catch (e) {
    logger.error('❌ Error al iniciar bot-service:', e);
    process.exit(1);
  }
}
start();
