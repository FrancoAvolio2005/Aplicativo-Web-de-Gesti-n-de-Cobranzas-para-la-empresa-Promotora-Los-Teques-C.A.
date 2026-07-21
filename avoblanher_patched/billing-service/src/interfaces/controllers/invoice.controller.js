const InvoiceService = require('../../application/services/InvoiceService');
const svc = new InvoiceService();

module.exports = {
  async getAll(req, res) {
    try { res.json(await svc.getAll(req.query)); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
  async getById(req, res) {
    try { res.json(await svc.getById(req.params.id)); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
  async getOverdue(req, res) {
    try { res.json(await svc.getOverdue()); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
  async create(req, res) {
    try { res.status(201).json(await svc.create(req.body)); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
  async update(req, res) {
    try { res.json(await svc.update(req.params.id, req.body)); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
  async updateStatus(req, res) {
    try { res.json(await svc.updateStatus(req.params.id, req.body.status)); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
  async delete(req, res) {
    try { await svc.delete(req.params.id); res.json({ message: 'Factura eliminada' }); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
  async notifyClient(req, res) {
    try { 
        // Llamamos al servicio (lo crearemos en el paso 2)
        const result = await svc.notifyClient(req.params.id); 
        res.json(result); 
    }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
};
