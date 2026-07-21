const ExchangeRateModel = require('../models/ExchangeRateModel');

class ExchangeRateRepository {
  async getLatest() {
    return ExchangeRateModel.findOne({ order: [['created_at', 'DESC']] });
  }
  async getHistory(limit = 50, offset = 0) {
    const { count, rows } = await ExchangeRateModel.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return { total: count, page: Math.floor(offset / limit) + 1, limit, data: rows };
  }
  async create(data) { return ExchangeRateModel.create(data); }
}

module.exports = ExchangeRateRepository;
