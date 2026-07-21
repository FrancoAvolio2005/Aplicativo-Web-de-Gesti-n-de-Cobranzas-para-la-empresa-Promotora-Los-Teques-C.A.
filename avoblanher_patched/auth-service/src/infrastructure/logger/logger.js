const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Crear carpeta de logs si no existe
const logsDir = path.join(__dirname, '../../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Archivo append-only para auditoría forense
    new transports.File({
      filename: path.join(logsDir, 'auth-error.log'),
      level: 'error',
      flags: 'a', // append-only
    }),
    new transports.File({
      filename: path.join(logsDir, 'auth-combined.log'),
      flags: 'a',
    }),
  ],
});

// En desarrollo también mostramos en consola con formato legible
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
  }));
}

module.exports = logger;
