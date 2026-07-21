const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const iaRoutes = require('./interfaces/routes/ia.routes');
const logger   = require('./infrastructure/logger/logger');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { logger.info(`${req.method} ${req.path}`); next(); });
app.use('/api', iaRoutes);
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'ia-service' }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
module.exports = app;
