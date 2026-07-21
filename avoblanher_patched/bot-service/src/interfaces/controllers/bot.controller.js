const axios      = require('axios');
const bcvAgent   = require('../../application/services/BCVSyncAgent');
const notifAgent = require('../../application/services/NotificationAgent');
const gmail      = require('../../infrastructure/adapters/GmailAdapter');
const NotificationRepository = require('../../infrastructure/repositories/NotificationRepository');
const logger     = require('../../infrastructure/logger/logger');

const repo        = new NotificationRepository();
const AUTH_URL    = process.env.AUTH_SERVICE_URL    || 'http://localhost:3001';
const BILLING_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3002';

function _internalToken() {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: 'bot-service', rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '5m' });
}

module.exports = {
  // GET /api/currency/bcv
  async getCurrentRate(req, res) {
    try {
      const rate = await bcvAgent.getLatest();
      if (!rate) return res.status(503).json({ error: 'Tasa BCV no disponible aún' });
      res.json({ tasa: parseFloat(rate.tasa), fuente: rate.fuente, fecha: rate.created_at });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  // GET /api/currency/history?limit=50&page=1
  async getRateHistory(req, res) {
    try {
      const limit  = parseInt(req.query.limit)  || 50;
      const page   = parseInt(req.query.page)   || 1;
      const offset = (page - 1) * limit;
      res.json(await bcvAgent.getHistory(limit, offset));
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  // POST /api/currency/sync
  async syncRate(req, res) {
    try {
      res.json({ message: 'Sincronización ejecutada', result: await bcvAgent.run() });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  // GET /api/notifications/history
  async getNotifications(req, res) {
    try { res.json(await notifAgent.getHistory()); }
    catch (e) { res.status(500).json({ error: e.message }); }
  },

  // POST /api/notifications/send — ciclo completo de avisos
  async sendNotifications(req, res) {
    try {
      logger.info('Disparo manual de notificaciones solicitado');
      res.json({ message: 'Ciclo ejecutado', result: await notifAgent.run() });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  // GET /api/bot/email-preview/:invoiceId — obtener HTML del email para previsualización
  async emailPreview(req, res) {
    try {
      const { invoiceId } = req.params;
      const tok = _internalToken();

      const { data: factura } = await axios.get(`${BILLING_URL}/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 8000,
      });
      const { data: clientesRaw } = await axios.get(`${AUTH_URL}/api/auth/clients`, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 8000,
      });
      const cliente = clientesRaw.find(c => c.id === factura.user_id);
      const latest  = await bcvAgent.getLatest();
      const tasaBcv = latest ? parseFloat(latest.tasa) : null;
      const montoUsd = tasaBcv ? `(≈ USD ${(factura.monto_ves / tasaBcv).toFixed(2)})` : '';

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
        body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:20px;}
        .card{background:#fff;border-radius:16px;max-width:540px;margin:0 auto;overflow:hidden;}
        .header{background:#4f46e5;padding:32px 40px;text-align:center;}
        .header h1{color:#fff;margin:0;font-size:22px;}.header p{color:#c7d2fe;margin:6px 0 0;font-size:14px;}
        .body{padding:32px 40px;}.body p{color:#475569;line-height:1.6;}
        .amount{background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;margin:24px 0;}
        .amount .label{color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;}
        .amount .value{color:#0f172a;font-size:32px;font-weight:700;margin:4px 0;}
        .amount .usd{color:#64748b;font-size:14px;}
        .btn{display:block;background:#4f46e5;color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px;margin:24px 0 0;}
        .footer{background:#f8fafc;padding:20px 40px;text-align:center;color:#94a3b8;font-size:12px;}
      </style></head><body><div class="card">
        <div class="header"><h1>Multiservicios AVOBLANHER C.A.</h1><p>Aviso de cuenta pendiente</p></div>
        <div class="body">
          <p>Estimado/a <strong>${cliente?.nombre || 'Cliente'}</strong>,</p>
          <p>Le informamos que tiene una factura vencida pendiente de pago.</p>
          <div class="amount">
            <div class="label">Monto a cancelar</div>
            <div class="value">Bs. ${parseFloat(factura.monto_ves).toLocaleString('es-VE',{minimumFractionDigits:2})}</div>
            <div class="usd">${montoUsd}</div>
          </div>
          <p><strong>Fecha de vencimiento:</strong> ${factura.fecha_vencimiento}</p>
          <p><strong>N° de factura:</strong> ${factura.id}</p>
          <a href="${process.env.PORTAL_URL || 'http://localhost:3000/portal'}" class="btn">Ir al Portal del Cliente →</a>
        </div>
        <div class="footer"><p>Mensaje automático. No responda.</p>
        <p>© ${new Date().getFullYear()} Multiservicios AVOBLANHER C.A.</p></div>
      </div></body></html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (e) {
      logger.error(`emailPreview error: ${e.message}`);
      res.status(e.response?.status || 500).json({ error: e.response?.data?.error || e.message });
    }
  },

  // POST /api/bot/notify/:invoiceId — notificar una factura específica
  async notifyInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const tok = _internalToken();

      // 1. Obtener factura
      const { data: factura } = await axios.get(`${BILLING_URL}/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 8000,
      });

      // 2. Obtener usuario-cliente
      const { data: clientesRaw } = await axios.get(`${AUTH_URL}/api/auth/clients`, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 8000,
      });
      const cliente = clientesRaw.find(c => c.id === factura.user_id);
      if (!cliente || !cliente.email) {
        return res.status(422).json({ error: 'No se puede obtener el email del cliente' });
      }

      // 3. Tasa BCV
      const latest = await bcvAgent.getLatest();
      const tasaBcv = latest ? parseFloat(latest.tasa) : null;

      // 4. Crear notificación
      const notif = await repo.create({
        factura_id:   factura.id,
        user_id:      factura.user_id,
        destinatario: cliente.email,
        asunto:       `Factura AVOBLANHER C.A. — Aviso de vencimiento`,
        estado:       'pendiente',
      });

      // 5. Enviar email
      const result = await gmail.sendOverdueNotice({
        to:               cliente.email,
        clienteNombre:    cliente.nombre,
        facturaId:        factura.id,
        montoVes:         factura.monto_ves,
        fechaVencimiento: factura.fecha_vencimiento,
        tasaBcv,
        empresa:          factura.empresa?.nombre || null,
      });

      if (result.ok) {
        await repo.update(notif.id, { estado: 'enviado' });
        logger.info(`Notificación individual enviada: factura ${invoiceId} → ${cliente.email}`);
        return res.json({ message: 'Notificación enviada correctamente', destinatario: cliente.email });
      } else {
        await repo.update(notif.id, { estado: 'fallido', error_detalle: result.error });
        return res.status(500).json({ error: result.error || 'Error al enviar email' });
      }
    } catch (e) {
      logger.error(`notifyInvoice error: ${e.message}`);
      res.status(e.response?.status || 500).json({ error: e.response?.data?.error || e.message });
    }
  },

  // POST /api/notify/new-invoice/:invoiceId — avisar al cliente que se le emitió una factura nueva
  async notifyNewInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const tok = _internalToken();

      // 1. Obtener factura
      const { data: factura } = await axios.get(`${BILLING_URL}/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 8000,
      });

      // 2. Obtener datos del cliente desde auth-service
      const { data: clientesRaw } = await axios.get(`${AUTH_URL}/api/auth/clients`, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 8000,
      });
      const cliente = clientesRaw.find(c => c.id === factura.user_id);
      if (!cliente || !cliente.email) {
        return res.status(422).json({ error: 'No se puede obtener el email del cliente' });
      }

      // 3. Tasa BCV para mostrar equivalente en USD
      const latest  = await bcvAgent.getLatest();
      const tasaBcv = latest ? parseFloat(latest.tasa) : null;

      // 4. Nombre de empresa (si la factura tiene company_id)
      let empresaNombre = null;
      if (factura.company_id) {
        try {
          const { data: empresa } = await axios.get(`${BILLING_URL}/api/companies/${factura.company_id}`, {
            headers: { Authorization: `Bearer ${tok}` }, timeout: 5000,
          });
          empresaNombre = empresa?.nombre || null;
        } catch (_) { /* no crítico */ }
      }

      // 5. Registrar notificación
      const notif = await repo.create({
        factura_id:   factura.id,
        user_id:      factura.user_id,
        destinatario: cliente.email,
        asunto:       `Factura AVOBLANHER C.A. — Nueva factura emitida`,
        estado:       'pendiente',
      });

      // 6. Enviar email de factura nueva
      const result = await gmail.sendNewInvoiceNotice({
        to:               cliente.email,
        clienteNombre:    cliente.nombre,
        facturaId:        factura.id,
        descripcion:      factura.descripcion,
        montoVes:         factura.monto_ves,
        fechaVencimiento: factura.fecha_vencimiento,
        tasaBcv,
        empresaNombre,
      });

      if (result.ok) {
        await repo.update(notif.id, { estado: 'enviado' });
        logger.info(`Aviso de factura nueva enviado: factura ${invoiceId} → ${cliente.email}`);
        return res.json({ message: 'Aviso de factura nueva enviado', destinatario: cliente.email });
      } else {
        await repo.update(notif.id, { estado: 'fallido', error_detalle: result.error });
        return res.status(500).json({ error: result.error || 'Error al enviar email' });
      }
    } catch (e) {
      logger.error(`notifyNewInvoice error: ${e.message}`);
      res.status(e.response?.status || 500).json({ error: e.response?.data?.error || e.message });
    }
  },
};
