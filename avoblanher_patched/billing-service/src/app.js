const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const path          = require('path');
const billingRoutes = require('./interfaces/routes/billing.routes');
const logger        = require('./infrastructure/logger/logger');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Archivos estáticos — comprobantes de pago guardados en disco
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath, { maxAge: '7d', etag: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api', billingRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'billing-service' }));

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'El archivo supera el límite de 5MB' });
  }
  logger.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;