const PaymentService = require('../../application/services/PaymentService');
const { UPLOAD_DIR } = require('../../infrastructure/adapters/UploadAdapter');
const path = require('path');
const fs   = require('fs');

const svc = new PaymentService();

module.exports = {
  async getAll(req, res) {
    try { res.json(await svc.getAll(req.query)); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },

  async getLast7Days(req, res) {
    try { res.json(await svc.getLast7Days()); }
    catch (e) { res.status(500).json({ error: e.message }); }
  },

  async create(req, res) {
    try {
      let comprobante_url = null;

      if (req.file) {
        comprobante_url = `/uploads/comprobantes/${req.file.filename}`;
      } else if (req.body.comprobante_url && req.body.comprobante_url.startsWith('data:')) {
        comprobante_url = _saveBase64(req.body.comprobante_url);
      }

      const payload = {
        factura_id:      req.body.factura_id,
        monto_original:  parseFloat(req.body.monto_original),
        moneda_original: req.body.moneda_original || 'VES',
        metodo_pago:     req.body.metodo_pago,
        referencia:      req.body.referencia || null,
        fecha_pago:      req.body.fecha_pago  || null,
        concepto:        req.body.concepto    || null,
        tipo_pago:       req.body.tipo_pago   || 'abonar',
        comprobante_url,
      };

      res.status(201).json(await svc.create(payload));
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async delete(req, res) {
    try {
      await svc.delete(req.params.id);
      res.json({ message: 'Pago revertido' });
    } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },

  async getComprobante(req, res) {
    try {
      const payment = await svc.getById(req.params.id);
      if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
      if (!payment.comprobante_url) return res.status(404).json({ error: 'Sin comprobante' });

      if (payment.comprobante_url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', '..', '..', payment.comprobante_url);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });
        return res.sendFile(filePath);
      }

      res.setHeader('Content-Type', 'text/html');
      return res.send(`<img src="${payment.comprobante_url}" style="max-width:100%;height:auto" />`);
    } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
};

function _saveBase64(dataUrl) {
  try {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;
    const ext      = matches[1].split('/')[1].replace('jpeg', 'jpg');
    const filename = `comprobante_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
    return `/uploads/comprobantes/${filename}`;
  } catch { return null; }
}