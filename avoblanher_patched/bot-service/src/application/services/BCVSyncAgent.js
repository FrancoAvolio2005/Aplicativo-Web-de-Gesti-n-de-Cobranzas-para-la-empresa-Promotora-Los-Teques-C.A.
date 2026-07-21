const cron       = require('node-cron');
const bcvAdapter = require('../../infrastructure/adapters/BcvScraperAdapter');
const ExchangeRateRepository = require('../../infrastructure/repositories/ExchangeRateRepository');
const logger     = require('../../infrastructure/logger/logger');

const repo = new ExchangeRateRepository();

class BCVSyncAgent {
  constructor() {
    this.lastRate = null;
  }

  async run() {
    logger.info('🤖 BCVSyncAgent: iniciando sincronización...');
    const result = await bcvAdapter.fetchRate();
    if (!result) {
      logger.warn('BCVSyncAgent: no se pudo obtener tasa, se mantiene la última conocida');
      return;
    }
    const saved = await repo.create({ tasa: result.tasa, fuente: result.fuente });
    this.lastRate = saved;
    logger.info(`✅ BCVSyncAgent: tasa guardada → ${result.tasa} (${result.fuente})`);
    return saved;
  }

  async getLatest() {
    return repo.getLatest();
  }

  async getHistory(limit = 50, offset = 0) {
    return repo.getHistory(limit, offset);
  }

  /**
   * Inicia el cron: cada hora en punto, zona horaria Caracas
   */
  start() {
    logger.info('🕐 BCVSyncAgent: cron iniciado (cada hora)');
    // Ejecutar inmediatamente al arrancar
    this.run();
    // Luego cada hora
    cron.schedule('0 * * * *', () => this.run(), { timezone: 'America/Caracas' });
  }
}

module.exports = new BCVSyncAgent();
