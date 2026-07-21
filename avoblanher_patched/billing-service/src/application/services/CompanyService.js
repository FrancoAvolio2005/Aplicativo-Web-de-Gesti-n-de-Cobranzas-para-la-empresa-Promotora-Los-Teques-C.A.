const CompanyRepository = require('../../infrastructure/repositories/CompanyRepository');
const logger = require('../../infrastructure/logger/logger');

const repo = new CompanyRepository();

class CompanyService {
  async getAll() {
    return repo.findAll();
  }

  async getById(id) {
    const c = await repo.findById(id);
    if (!c) { const e = new Error('Empresa no encontrada'); e.status = 404; throw e; }
    return c;
  }

  async getByUser(userId) {
    return repo.findByUserId(userId);
  }

  async create({ rif, nombre, direccion, user_id }) {
    if (!rif || !nombre || !user_id) {
      const e = new Error('rif, nombre y user_id son requeridos'); e.status = 400; throw e;
    }
    const existing = await repo.findByRif(rif);
    if (existing) { const e = new Error('Ya existe una empresa con ese RIF'); e.status = 409; throw e; }
    const company = await repo.create({ rif, nombre, direccion, user_id });
    logger.info(`Empresa creada: ${company.id} (${rif})`);
    return company;
  }

  async update(id, data) {
    const c = await repo.findById(id);
    if (!c) { const e = new Error('Empresa no encontrada'); e.status = 404; throw e; }
    return repo.update(id, data);
  }

  async setActive(id, activo) {
    const c = await repo.findById(id);
    if (!c) { const e = new Error('Empresa no encontrada'); e.status = 404; throw e; }
    return repo.setActive(id, activo);
  }
}

module.exports = CompanyService;
