require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const proxy      = require('express-http-proxy');
const logger     = require('./config/logger');
const authenticate = require('./middlewares/auth.middleware');
const authorize    = require('./middlewares/rbac.middleware');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Demasiadas peticiones. Intenta en 15 minutos.' },
  // Si no es producción, salta la limitación
  skip: (req, res) => process.env.NODE_ENV !== 'production',
});

app.use(globalLimiter);

app.use(morgan('combined', {
  stream: { write: msg => logger.info(msg.trim()) },
}));

const AUTH_URL    = process.env.AUTH_SERVICE_URL    || 'http://localhost:3001';
const BILLING_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3002';
const IA_URL      = process.env.IA_SERVICE_URL      || 'http://localhost:3003';
const BOT_URL     = process.env.BOT_SERVICE_URL     || 'http://localhost:3004';

const proxyOptions = {
  proxyReqPathResolver: req => req.originalUrl,
  proxyReqBodyDecorator(bodyContent, srcReq) {
    if (['POST', 'PUT', 'PATCH'].includes(srcReq.method)) {
      return JSON.stringify(srcReq.body);
    }
    return bodyContent;
  },
  proxyReqOptDecorator(proxyReqOpts) {
    proxyReqOpts.headers['Content-Type'] = 'application/json';
    return proxyReqOpts;
  },
  proxyErrorHandler(err, res) {
    logger.error(`Proxy error: ${err.message}`);
    res.status(502).json({ error: 'Servicio no disponible temporalmente.' });
  },
};

// ── Auth Service (login, registro, forgot-password — rutas públicas)
app.use('/api/auth', proxy(AUTH_URL, proxyOptions));

// A partir de aquí: autenticación requerida
app.use(authenticate);
app.use(authorize);

// ── Billing Service
app.use('/api/companies', proxy(BILLING_URL, proxyOptions));
app.use('/api/invoices',  proxy(BILLING_URL, proxyOptions));
app.use('/api/payments',  proxy(BILLING_URL, proxyOptions));
app.use('/api/accounts',  proxy(BILLING_URL, proxyOptions));

// ── IA Service
app.use('/api/ocr',  proxy(IA_URL, proxyOptions));
app.use('/api/risk', proxy(IA_URL, proxyOptions));

// ── Bot Service
app.use('/api/currency',      proxy(BOT_URL, proxyOptions));
app.use('/api/notifications', proxy(BOT_URL, proxyOptions));
app.use('/api/bot',           proxy(BOT_URL, proxyOptions));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'api-gateway' }));

app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.message}`);
  res.status(500).json({ error: 'Error interno del gateway' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => logger.info(`🚀 Gateway corriendo en :${PORT}`));
