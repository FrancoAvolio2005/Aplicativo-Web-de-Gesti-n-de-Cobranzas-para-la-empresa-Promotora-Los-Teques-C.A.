const CompanyService = require('../../application/services/CompanyService');
const logger = require('../../infrastructure/logger/logger');

const service = new CompanyService();

class CompanyController {
  async getAll(req, res) {
    try {
      return res.json(await service.getAll());
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async getById(req, res) {
    try {
      return res.json(await service.getById(req.params.id));
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  // GET /companies/by-user/:userId — empresas de un usuario (cliente)
  async getByUserId(req, res) {
    try {
      return res.json(await service.getByUser(req.params.userId));
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async create(req, res) {
    try {
      return res.status(201).json(await service.create(req.body));
    } catch (e) { logger.error(`create company: ${e.message}`); return res.status(e.status || 500).json({ error: e.message }); }
  }

  async update(req, res) {
    try {
      return res.json(await service.update(req.params.id, req.body));
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async deactivate(req, res) {
    try {
      return res.json(await service.setActive(req.params.id, false));
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async activate(req, res) {
    try {
      return res.json(await service.setActive(req.params.id, true));
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }
}

module.exports = new CompanyController();
