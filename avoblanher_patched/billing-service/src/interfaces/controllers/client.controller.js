const ClientService = require('../../application/services/ClientService');
const svc = new ClientService();

module.exports = {
  async getAll(req, res)    { try { res.json(await svc.getAll(req.query)); } catch(e) { res.status(e.status||500).json({error:e.message}); } },
  async getById(req, res)   { try { res.json(await svc.getById(req.params.id)); } catch(e) { res.status(e.status||500).json({error:e.message}); } },
  async create(req, res)    { try { res.status(201).json(await svc.create(req.body)); } catch(e) { res.status(e.status||500).json({error:e.message}); } },
  async update(req, res)    { try { res.json(await svc.update(req.params.id, req.body)); } catch(e) { res.status(e.status||500).json({error:e.message}); } },
  async deactivate(req, res){ try { res.json({ message:'Cliente desactivado', data: await svc.deactivate(req.params.id) }); } catch(e) { res.status(e.status||500).json({error:e.message}); } },
  async activate(req, res)  { try { res.json({ message:'Cliente activado',    data: await svc.activate(req.params.id)   }); } catch(e) { res.status(e.status||500).json({error:e.message}); } },
  async delete(req, res)    { try { await svc.delete(req.params.id); res.json({ message:'Cliente eliminado' }); } catch(e) { res.status(e.status||500).json({error:e.message}); } },
};
