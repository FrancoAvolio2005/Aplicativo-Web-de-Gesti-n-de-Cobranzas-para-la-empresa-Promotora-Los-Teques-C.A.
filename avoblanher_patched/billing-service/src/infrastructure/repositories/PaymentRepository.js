const { Op, fn, col } = require('sequelize');
const PaymentModel    = require('../models/PaymentModel');
const InvoiceModel    = require('../models/InvoiceModel');

class PaymentRepository {
  async findAll({ factura_id } = {}) {
    const where = {};
    if (factura_id) where.factura_id = factura_id;
    return PaymentModel.findAll({
      where,
      include: [{ model: InvoiceModel, as: 'factura' }],
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id) {
    return PaymentModel.findByPk(id, {
      include: [{ model: InvoiceModel, as: 'factura' }],
    });
  }

  /**
   * Pagos de un usuario (todos sus clientes / facturas).
   * Se obtienen buscando las facturas cuyo user_id coincide.
   */
  async findByUserId(userId) {
    return PaymentModel.findAll({
      include: [{
        model: InvoiceModel,
        as: 'factura',
        where: { user_id: userId },
        required: true,
      }],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Pagos por listado de factura_ids (para AccountService).
   */
  async findByFacturaIds(ids) {
    if (!ids || ids.length === 0) return [];
    return PaymentModel.findAll({
      where: { factura_id: { [Op.in]: ids } },
      order: [['fecha_pago', 'DESC']],
    });
  }

  async create(data) {
    return PaymentModel.create(data);
  }

  async delete(id) {
    return PaymentModel.destroy({ where: { id } });
  }

  async getLast7Days() {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const rows = await PaymentModel.findAll({
      attributes: [
        'fecha_pago',
        [fn('SUM', col('monto_ves')), 'total'],
      ],
      where: { fecha_pago: { [Op.gte]: since } },
      group: ['fecha_pago'],
      order: [['fecha_pago', 'ASC']],
      raw: true,
    });

    const map = {};
    rows.forEach(r => { map[r.fecha_pago] = parseFloat(r.total); });

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key   = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es', { weekday: 'short' });
      result.push({ dia: label, fecha: key, monto: map[key] || 0 });
    }
    return result;
  }
}

module.exports = PaymentRepository;
