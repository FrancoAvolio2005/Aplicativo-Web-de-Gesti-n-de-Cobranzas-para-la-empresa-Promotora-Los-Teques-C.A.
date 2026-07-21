require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./infrastructure/database/connection');
const logger = require('./infrastructure/logger/logger');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión a PostgreSQL establecida correctamente');

    app.listen(PORT, () => {
      logger.info(`🚀 auth-service corriendo en puerto ${PORT}`);
      logger.info(`📌 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
  }
}

startServer();
