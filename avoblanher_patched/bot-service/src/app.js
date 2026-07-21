const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const botRoutes = require('./interfaces/routes/bot.routes');
const logger    = require('./infrastructure/logger/logger');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use((req, res, next) => { logger.info(`${req.method} ${req.path}`); next(); });
app.use('/api', botRoutes);
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'bot-service' }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
module.exports = app;
