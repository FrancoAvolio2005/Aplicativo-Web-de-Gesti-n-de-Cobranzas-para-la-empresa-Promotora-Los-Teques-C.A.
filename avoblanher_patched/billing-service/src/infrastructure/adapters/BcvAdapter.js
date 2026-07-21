const axios = require('axios');
const logger = require('../logger/logger');

const BOT_SERVICE_URL = process.env.BOT_SERVICE_URL || 'http://localhost:3004';

class BcvAdapter {
  async getCurrentRate() {
    try {
      const res = await axios.get(`${BOT_SERVICE_URL}/api/currency/bcv`, { timeout: 5000 });
      return res.data.tasa || null;
    } catch (err) {
      logger.warn(`No se pudo obtener tasa BCV del bot-service: ${err.message}`);
      return null;
    }
  }
}

module.exports = new BcvAdapter();
