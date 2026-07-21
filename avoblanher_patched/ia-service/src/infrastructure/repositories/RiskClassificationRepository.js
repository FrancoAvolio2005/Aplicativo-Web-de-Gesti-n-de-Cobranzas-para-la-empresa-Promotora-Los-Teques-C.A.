const RiskClassificationModel = require('../models/RiskClassificationModel');

class RiskClassificationRepository {
  async findAll({ user_id, nivel_riesgo } = {}) {
    const where = {};
    if (user_id) where.user_id = user_id;
    if (nivel_riesgo) where.nivel_riesgo = nivel_riesgo;
    return RiskClassificationModel.findAll({ where, order: [['created_at', 'DESC']] });
  }
  async create(data) { return RiskClassificationModel.create(data); }
}

module.exports = RiskClassificationRepository;
