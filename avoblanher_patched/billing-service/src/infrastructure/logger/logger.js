const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '../../../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'billing-service' },
  transports: [
    new transports.File({ filename: path.join(logsDir, 'billing-error.log'), level: 'error', flags: 'a' }),
    new transports.File({ filename: path.join(logsDir, 'billing-combined.log'), flags: 'a' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({ format: format.combine(format.colorize(), format.simple()) }));
}

module.exports = logger;
