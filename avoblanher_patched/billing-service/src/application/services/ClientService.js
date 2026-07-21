const ClientRepository = require('../../infrastructure/repositories/ClientRepository');
const logger = require('../../infrastructure/logger/logger');
const repo = new ClientRepository();

class ClientService {
  async getAll(query)   { return repo.findAll(query); }
  async getById(id) {
    const client = await repo.findById(id);
    if (!client) { const e = new Error('Cliente no encontrado'); e.status = 404; throw e; }
    return client;
  }
  async create(data) {
    if (await repo.findByEmail(data.email))   { const e = new Error('Ya existe un cliente con ese email');   e.status = 409; throw e; }
    if (await repo.findByCedula(data.cedula)) { const e = new Error('Ya existe un cliente con esa cédula'); e.status = 409; throw e; }
    const client = await repo.create(data);
    logger.info(`Cliente creado: ${client.email}`);
    return client;
  }
  async update(id, data) { await this.getById(id); return repo.update(id, data); }
  async deactivate(id)   { await this.getById(id); return repo.deactivate(id); }
  async activate(id)     { await this.getById(id); return repo.activate(id); }
  async delete(id)       { await this.getById(id); await repo.delete(id); }
}
module.exports = ClientService;
