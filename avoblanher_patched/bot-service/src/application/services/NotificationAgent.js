const cron        = require('node-cron');
const axios       = require('axios');
const gmail       = require('../../infrastructure/adapters/GmailAdapter');
const bcvAgent    = require('./BCVSyncAgent');
const NotificationRepository = require('../../infrastructure/repositories/NotificationRepository');
const logger      = require('../../infrastructure/logger/logger');
const { Op }      = require('sequelize');
const NotificationModel = require('../../infrastructure/models/NotificationModel');

const repo = new NotificationRepository();
const AUTH_URL    = process.env.AUTH_SERVICE_URL    || 'http://localhost:3001';
const BILLING_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3002';

class NotificationAgent {
  async run() {
    logger.info('🤖 NotificationAgent: iniciando ciclo de avisos...');

    // 1. Obtener facturas vencidas Y pendientes del billing-service (Cambio #9)
    let overdueInvoices = [];
    try {
      const res = await axios.get(`${BILLING_URL}/api/invoices/overdue`, {
        headers: { Authorization: `Bearer ${this._getInternalToken()}` },
        timeout: 10000,
      });
      overdueInvoices = res.data || [];
    } catch (err) {
      logger.error(`No se pudo contactar billing-service: ${err.message}`);
      return { enviados: 0, fallidos: 0, omitidos: 0 };
    }

    if (overdueInvoices.length === 0) {
      logger.info('NotificationAgent: sin facturas vencidas pendientes');
      return { enviados: 0, fallidos: 0, omitidos: 0 };
    }

    // 2. Cargar usuarios-clientes del auth-service en batch
    let usersMap = {};
    try {
      const res = await axios.get(`${AUTH_URL}/api/auth/clients`, {
        headers: { Authorization: `Bearer ${this._getInternalToken()}` },
        timeout: 10000,
      });
      (res.data || []).forEach(u => { usersMap[u.id] = u; });
    } catch (err) {
      logger.warn(`No se pudo obtener clientes del auth-service: ${err.message}`);
    }

    // 3. Obtener tasa BCV actual
    const latestRate = await bcvAgent.getLatest();
    const tasaBcv = latestRate ? parseFloat(latestRate.tasa) : null;

    let enviados = 0, fallidos = 0, omitidos = 0;

    for (const factura of overdueInvoices) {
      // Resolver destinatario desde user_id
      const cliente = usersMap[factura.user_id];
      if (!cliente || !cliente.email) { omitidos++; continue; }

      // Filtrar: no notificar si ya fue avisado en las últimas 24h
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yaNotificado = await NotificationModel.count({
        where: { user_id: factura.user_id, estado: 'enviado', created_at: { [Op.gte]: hace24h } },
      });
      if (yaNotificado > 0) { omitidos++; continue; }

      // Crear registro previo en "pendiente"
      const notif = await repo.create({
        factura_id:   factura.id,
        user_id:      factura.user_id,
        destinatario: cliente.email,
        asunto:       `Factura vencida — AVOBLANHER C.A.`,
        estado:       'pendiente',
      });

      // Enviar correo
      const result = await gmail.sendOverdueNotice({
        to:               cliente.email,
        clienteNombre:    cliente.nombre,
        facturaId:        factura.id,
        montoVes:         factura.monto_ves,
        fechaVencimiento: factura.fecha_vencimiento,
        tasaBcv,
        empresa:          factura.empresa?.nombre || null,
      });

      // Actualizar estado
      if (result.ok) {
        await repo.update(notif.id, { estado: 'enviado' });
        enviados++;
      } else {
        await repo.update(notif.id, { estado: 'fallido', error_detalle: result.error });
        fallidos++;
      }
    }

    logger.info(`✅ NotificationAgent: enviados=${enviados} fallidos=${fallidos} omitidos=${omitidos}`);
    return { enviados, fallidos, omitidos };
  }

  _getInternalToken() {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: 'bot-service', rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  }

  async getHistory() {
    return repo.findAll({});
  }

  start() {
    logger.info('📧 NotificationAgent: cron iniciado (8:00 AM Caracas)');
    cron.schedule('0 8 * * *', () => this.run(), { timezone: 'America/Caracas' });
  }
}

module.exports = new NotificationAgent();
