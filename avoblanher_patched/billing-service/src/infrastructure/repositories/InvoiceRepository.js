const PaymentModel  = require('../models/PaymentModel');
const InvoiceModel  = require('../models/InvoiceModel');
const CompanyModel  = require('../models/CompanyModel');
const { Op }        = require('sequelize');

class InvoiceRepository {
  async findAll({ status, user_id, company_id } = {}) {
    const where = {};
    if (status)               where.status     = status;
    if (user_id)              where.user_id    = user_id;
    if (company_id !== undefined) {
      // Si es null explícito → facturas SIN empresa (IS NULL)
      where.company_id = company_id === null ? { [Op.is]: null } : company_id;
    }
    return InvoiceModel.findAll({
      where,
      include: [
        { model: CompanyModel, as: 'empresa', required: false },
        { model: PaymentModel, as: 'pagos', required: false, order: [['created_at', 'DESC']], limit: 1 },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id) {
    return InvoiceModel.findByPk(id, {
      include: [{ model: CompanyModel, as: 'empresa', required: false }],
    });
  }

  async findByUserId(userId) {
    return InvoiceModel.findAll({
      where: { user_id: userId },
      include: [{ model: CompanyModel, as: 'empresa', required: false }],
      order: [['created_at', 'DESC']],
    });
  }

  // Cambio #9: incluye pendientes además de vencidas/mora
  async findOverdue() {
    return InvoiceModel.findAll({
      where: { status: { [Op.in]: ['pendiente', 'vencida', 'mora'] } },
      include: [{ model: CompanyModel, as: 'empresa', required: false }],
      order: [['fecha_vencimiento', 'ASC']],
    });
  }

  async create(data) {
    return InvoiceModel.create(data);
  }

  async update(id, data) {
    await InvoiceModel.update(data, { where: { id } });
    return this.findById(id);
  }

  async updateStatus(id, status) {
    await InvoiceModel.update({ status }, { where: { id } });
    return this.findById(id);
  }

  async delete(id) {
    return InvoiceModel.destroy({ where: { id } });
  }
}

module.exports = InvoiceRepository;
