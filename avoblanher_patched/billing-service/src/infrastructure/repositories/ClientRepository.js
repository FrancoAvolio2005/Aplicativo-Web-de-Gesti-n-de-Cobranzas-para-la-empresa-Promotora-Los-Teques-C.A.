const ClientModel = require('../models/ClientModel');
const { Op } = require('sequelize');

class ClientRepository {
  async findAll({ search } = {}) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { cedula: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    return ClientModel.findAll({ where, order: [['created_at', 'DESC']] });
  }
  async findById(id)       { return ClientModel.findByPk(id); }
  async findByEmail(email) { return ClientModel.findOne({ where: { email: email.toLowerCase() } }); }
  async findByCedula(c)    { return ClientModel.findOne({ where: { cedula: c } }); }
  async create(data)       { return ClientModel.create({ ...data, email: data.email.toLowerCase() }); }
  async update(id, data)   { await ClientModel.update(data, { where: { id } }); return this.findById(id); }
  async deactivate(id)     { await ClientModel.update({ activo: false }, { where: { id } }); return this.findById(id); }
  async activate(id)       { await ClientModel.update({ activo: true  }, { where: { id } }); return this.findById(id); }
  async delete(id)         { return ClientModel.destroy({ where: { id } }); }
}
module.exports = ClientRepository;
