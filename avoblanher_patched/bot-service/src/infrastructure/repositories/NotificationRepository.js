const NotificationModel = require('../models/NotificationModel');

class NotificationRepository {
  async findAll({ user_id, estado } = {}) {
    const where = {};
    if (user_id) where.user_id = user_id;
    if (estado) where.estado = estado;
    return NotificationModel.findAll({ where, order: [['created_at', 'DESC']] });
  }
  async wasNotifiedRecently(user_id, horasAtras = 24) {
    const desde = new Date(Date.now() - horasAtras * 60 * 60 * 1000);
    const count = await NotificationModel.count({
      where: { user_id, estado: 'enviado', created_at: { $gte: desde } },
    });
    return count > 0;
  }
  async create(data) { return NotificationModel.create(data); }
  async update(id, data) { return NotificationModel.update(data, { where: { id } }); }
}

module.exports = NotificationRepository;
