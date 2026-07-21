const axios  = require('axios');
const logger = require('../logger/logger');

/**
 * BcvScraperAdapter — obtiene tasa oficial BCV desde APIs públicas gratuitas.
 *
 * FUENTES (en orden de prioridad):
 *  1. dolarapi.com       → scrapea el BCV oficial. Sin API key. Gratis.
 *     GET https://ve.dolarapi.com/v1/dolares/oficial
 *
 *  2. ExchangeRate-API   → API internacional. 1500 req/mes gratis. Sin key.
 *     GET https://open.er-api.com/v6/latest/USD
 *
 *  3. null               → fallback: el agente mantiene la última tasa válida en BD.
 *
 * El BCV actualiza la tasa cada día hábil ~2:30 PM hora Venezuela.
 * El cron corre cada hora para capturarla apenas cambie.
 */
class BcvScraperAdapter {
  async fetchRate() {
    // Fuente 1: DolarAPI.com
    try {
      const res = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial', {
        timeout: 8000,
        headers: { 'User-Agent': 'AVOBLANHER-BotService/1.0' },
      });
      if (res.data?.promedio) {
        const tasa = parseFloat(parseFloat(res.data.promedio).toFixed(4));
        logger.info(`✅ Tasa BCV de dolarapi.com: ${tasa}`);
        return { tasa, fuente: 'BCV' };
      }
    } catch (e) {
      logger.warn(`dolarapi.com fallo: ${e.message}`);
    }

    // Fuente 2: ExchangeRate-API
    try {
      const res = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 8000 });
      if (res.data?.rates?.VES) {
        const tasa = parseFloat(res.data.rates.VES.toFixed(4));
        logger.info(`✅ Tasa USD/VES de ExchangeRate-API: ${tasa}`);
        return { tasa, fuente: 'DolarToday' };
      }
    } catch (e) {
      logger.warn(`ExchangeRate-API fallo: ${e.message}`);
    }

    logger.error('❌ Todas las fuentes BCV fallaron. Manteniendo ultima tasa en BD.');
    return null;
  }
}

module.exports = new BcvScraperAdapter();
