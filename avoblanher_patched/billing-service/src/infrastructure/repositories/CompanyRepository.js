const CompanyModel = require('../models/CompanyModel');

class CompanyRepository {
  async findAll() {
    return CompanyModel.findAll({ order: [['nombre', 'ASC']] });
  }

  async findById(id) {
    return CompanyModel.findByPk(id);
  }

  async findByUserId(userId) {
    return CompanyModel.findAll({
      where: { user_id: userId },
      order: [['nombre', 'ASC']],
    });
  }

  async findByRif(rif) {
    return CompanyModel.findOne({ where: { rif } });
  }

  async create(data) {
    return CompanyModel.create(data);
  }

  async update(id, data) {
    await CompanyModel.update(data, { where: { id } });
    return this.findById(id);
  }

  async setActive(id, activo) {
    await CompanyModel.update({ activo }, { where: { id } });
    return this.findById(id);
  }
}

module.exports = CompanyRepository;
