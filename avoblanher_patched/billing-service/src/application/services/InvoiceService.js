const InvoiceRepository = require('../../infrastructure/repositories/InvoiceRepository');
const CompanyRepository = require('../../infrastructure/repositories/CompanyRepository');
const logger = require('../../infrastructure/logger/logger');
const axios  = require('axios');

const invRepo  = new InvoiceRepository();
const compRepo = new CompanyRepository();
  const jwt = require('jsonwebtoken');

class InvoiceService {
  async getAll(query) {
    return invRepo.findAll(query);
  }

  async getById(id) {
    const inv = await invRepo.findById(id);
    if (!inv) { const e = new Error('Factura no encontrada'); e.status = 404; throw e; }
    return inv;
  }

  async getByUser(userId) {
    return invRepo.findByUserId(userId);
  }

  async getOverdue() {
    return invRepo.findOverdue();
  }

  async create({ user_id, company_id, descripcion, monto_ves, fecha_vencimiento }) {
    if (!user_id)          { const e = new Error('user_id es requerido'); e.status = 400; throw e; }
    if (!monto_ves)        { const e = new Error('monto_ves es requerido'); e.status = 400; throw e; }
    if (!fecha_vencimiento){ const e = new Error('fecha_vencimiento es requerida'); e.status = 400; throw e; }

    // Verificar que el cliente esté activo consultando auth-service
    const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    try {
      const jwt = require('jsonwebtoken');
      const tok = jwt.sign({ id: 'billing-service', rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2m' });
      const { data: clients } = await axios.get(`${AUTH_URL}/api/auth/clients`, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 5000,
      });
      const cliente = clients.find(c => c.id === user_id);
      if (cliente && cliente.activo === false) {
        const e = new Error('No se puede crear una factura: el cliente está inactivo'); e.status = 422; throw e;
      }
    } catch (err) {
      if (err.status === 422) throw err;
      // Si no se puede contactar auth-service, permitir (no bloquear el sistema)
      logger.warn(`No se pudo verificar estado del cliente en auth-service: ${err.message}`);
    }

    // Si se envía company_id, validar que exista, pertenezca al user y esté activa
    if (company_id) {
      const comp = await compRepo.findById(company_id);
      if (!comp)                    { const e = new Error('Empresa no encontrada'); e.status = 404; throw e; }
      if (comp.user_id !== user_id) { const e = new Error('La empresa no pertenece a este cliente'); e.status = 422; throw e; }
      if (comp.activo === false)    { const e = new Error('No se puede crear una factura: la empresa está inactiva'); e.status = 422; throw e; }
    }

    const inv = await invRepo.create({ user_id, company_id: company_id || null, descripcion, monto_ves, fecha_vencimiento });
    logger.info(`Factura creada: ${inv.id} para user ${user_id}`);

    // Enviar aviso automático al cliente por correo
    const BOT_URL = process.env.BOT_SERVICE_URL || 'http://localhost:3004';
    try {
      const tok = jwt.sign({ id: 'billing-service', rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2m' });
      await axios.post(`${BOT_URL}/api/notify/new-invoice/${inv.id}`, {}, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 10000,
      });
      logger.info(`Aviso de factura nueva disparado para factura ${inv.id}`);
    } catch (err) {
      // No bloquear la creación de la factura si el email falla
      logger.warn(`No se pudo enviar aviso de factura nueva (factura ${inv.id}): ${err.message}`);
    }

    return inv;
  }

  async update(id, data) {
    const inv = await invRepo.findById(id);
    if (!inv) { const e = new Error('Factura no encontrada'); e.status = 404; throw e; }
    return invRepo.update(id, data);
  }

  async updateStatus(id, status) {
    const valid = ['pendiente', 'vencida', 'mora', 'pagada', 'anulada'];
    if (!valid.includes(status)) { const e = new Error('Estado inválido'); e.status = 400; throw e; }
    const inv = await invRepo.findById(id);
    if (!inv) { const e = new Error('Factura no encontrada'); e.status = 404; throw e; }
    return invRepo.updateStatus(id, status);
  }

  async delete(id) {
    const inv = await invRepo.findById(id);
    if (!inv) { const e = new Error('Factura no encontrada'); e.status = 404; throw e; }
    await invRepo.delete(id);
    logger.info(`Factura eliminada: ${id}`);
  }

async notifyClient(id) {
  const inv = await this.getById(id);
  // Cambio #7 y #9: permitir enviar facturas pendientes además de vencidas
  if (['anulada', 'pagada'].includes(inv.status)) {
    const e = new Error('No se puede notificar una factura pagada o anulada'); e.status = 422; throw e;
  }
  const BOT_URL = process.env.BOT_SERVICE_URL || 'http://localhost:3004';
  
  // Generar un token "falso" que el bot acepte como admin
  const internalToken = jwt.sign(
    { id: 'billing-service', rol: 'admin' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1m' }
  );

  try {
    const response = await axios.post(`${BOT_URL}/api/notify/${id}`, {
      invoiceId: inv.id,
      monto: inv.monto_ves
    }, { 
      headers: { Authorization: `Bearer ${internalToken}` }, // ENVIAR EL TOKEN
      timeout: 10000 
    });

    return { success: true, message: 'Notificación enviada' };
  } catch (err) {
    throw { status: err.response?.status || 502, message: err.message };
  }
}
} // Fin de la clase

module.exports = InvoiceService;
