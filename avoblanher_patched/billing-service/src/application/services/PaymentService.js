const PaymentRepository  = require('../../infrastructure/repositories/PaymentRepository');
const InvoiceRepository  = require('../../infrastructure/repositories/InvoiceRepository');
const bcvAdapter         = require('../../infrastructure/adapters/BcvAdapter');
const logger             = require('../../infrastructure/logger/logger');

const payRepo = new PaymentRepository();
const invRepo = new InvoiceRepository();

class PaymentService {
  async getAll(query) { return payRepo.findAll(query); }

  async getByUser(user_id) { return payRepo.findByUserId(user_id); }

  async getLast7Days() { return payRepo.getLast7Days(); }

  async getById(id) {
    const pay = await payRepo.findById(id);
    if (!pay) { const e = new Error('Pago no encontrado'); e.status = 404; throw e; }
    return pay;
  }

  /**
   * registradoPorAdmin: true si el pago fue iniciado desde el panel del admin
   */
  async create({ factura_id, monto_original, moneda_original = 'VES', metodo_pago, referencia, comprobante_url, fecha_pago, concepto, tipo_pago = 'abonar', registradoPorAdmin = false }) {
    const invoice = await invRepo.findById(factura_id);
    if (!invoice) { const e = new Error('Factura no encontrada'); e.status = 404; throw e; }
    if (['pagada', 'anulada'].includes(invoice.status)) {
      const e = new Error(`No se puede registrar pago en una factura ${invoice.status}`); e.status = 422; throw e;
    }

    let monto_ves = monto_original;
    let tasa_bcv  = null;

    // Siempre obtener la tasa BCV del día (para registrarla en pagos VES también)
    tasa_bcv = await bcvAdapter.getCurrentRate();

    if (moneda_original === 'USD') {
      if (!tasa_bcv) { const e = new Error('No se pudo obtener la tasa BCV. Intenta de nuevo.'); e.status = 503; throw e; }
      monto_ves = parseFloat((monto_original * tasa_bcv).toFixed(2));
    }

    const montoFactura = parseFloat(invoice.monto_ves);

    // Calcular suma de pagos ya existentes para esta factura
    const pagosExistentes = await payRepo.findByFacturaIds([factura_id]);
    const totalAbonado = pagosExistentes.reduce((s, p) => s + parseFloat(p.monto_ves || 0), 0);
    const saldoPendiente = parseFloat((montoFactura - totalAbonado).toFixed(2));

    // Si tipo_pago es 'pagar_completo', fijar monto al saldo pendiente real
    if (tipo_pago === 'pagar_completo') {
      monto_ves = saldoPendiente > 0 ? saldoPendiente : 0;
      if (moneda_original === 'USD' && tasa_bcv) {
        monto_original = parseFloat((monto_ves / tasa_bcv).toFixed(2));
      } else {
        monto_original = monto_ves;
      }
    }

    // Validación para modo abonar: el abono no puede exceder el saldo pendiente
    if (tipo_pago === 'abonar') {
      if (moneda_original === 'USD' && tasa_bcv) {
        if (monto_ves > saldoPendiente * 1.01) {
          const e = new Error(`El abono (Bs. ${monto_ves.toLocaleString('es-VE')}) excede el saldo pendiente (Bs. ${saldoPendiente.toLocaleString('es-VE')}). Use "Pagar Completo" para saldar la factura.`);
          e.status = 422; throw e;
        }
      } else if (moneda_original === 'VES') {
        if (parseFloat(monto_ves) >= saldoPendiente) {
          const e = new Error(`En modo "Abonar", el monto debe ser menor al saldo pendiente (Bs. ${saldoPendiente.toLocaleString('es-VE')}). Use "Pagar Completo" para saldar la factura.`);
          e.status = 422; throw e;
        }
      }
    }

    // concepto enriquecido para abonos
    let conceptoFinal = concepto || null;
    if (tipo_pago === 'abonar') {
      const montoFormateado = parseFloat(monto_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 });
      conceptoFinal = `El cliente abonó Bs. ${montoFormateado} a la factura`;
      if (concepto) conceptoFinal += ` — ${concepto}`;
    }
    if (registradoPorAdmin) {
      conceptoFinal = (conceptoFinal ? conceptoFinal + ' | ' : '') + 'Pago realizado por un administrador';
    }

    const payment = await payRepo.create({
      factura_id,
      monto_ves,
      monto_original,
      moneda_original,
      tasa_bcv,
      metodo_pago,
      referencia:      referencia || null,
      concepto:        conceptoFinal,
      comprobante_url: comprobante_url || null,
      fecha_pago:      fecha_pago || new Date().toISOString().split('T')[0],
      hora_pago:       new Date().toTimeString().split(' ')[0],
      registrado_por_admin: registradoPorAdmin ? true : false,
    });

    // Determinar nuevo status de la factura según la suma total de pagos
    // IMPORTANTE: NO se modifica monto_ves de la factura — siempre conserva el monto original.
    const nuevoTotalAbonado = totalAbonado + parseFloat(monto_ves);
    if (tipo_pago === 'pagar_completo' || nuevoTotalAbonado >= montoFactura - 0.01) {
      await invRepo.updateStatus(factura_id, 'pagada');
      logger.info(`Factura ${factura_id} marcada como PAGADA. Total pagado: Bs. ${nuevoTotalAbonado.toFixed(2)}`);
    } else {
      const saldoRestante = parseFloat((montoFactura - nuevoTotalAbonado).toFixed(2));
      logger.info(`Factura ${factura_id} abono de Bs. ${monto_ves}. Saldo restante: Bs. ${saldoRestante}`);
    }

    logger.info(`Pago registrado: ${payment.id} | tipo: ${tipo_pago} | admin: ${registradoPorAdmin} | comprobante: ${comprobante_url ? 'sí' : 'no'}`);
    return payment;
  }

  async delete(id) {
    const pay = await payRepo.findById(id);
    if (!pay) { const e = new Error('Pago no encontrado'); e.status = 404; throw e; }

    if (pay.comprobante_url && pay.comprobante_url.startsWith('/uploads/')) {
      const pathMod  = require('path');
      const fs       = require('fs');
      const filePath = pathMod.join(__dirname, '..', '..', '..', pay.comprobante_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Comprobante eliminado del disco: ${filePath}`);
      }
    }

    // Eliminar el pago primero
    await payRepo.delete(id);

    // Recalcular status de la factura según los pagos restantes
    const invoice = await invRepo.findById(pay.factura_id);
    if (invoice && invoice.status !== 'anulada') {
      const pagosRestantes = await payRepo.findByFacturaIds([pay.factura_id]);
      const totalRestante = pagosRestantes.reduce((s, p) => s + parseFloat(p.monto_ves || 0), 0);
      const montoFactura = parseFloat(invoice.monto_ves);
      if (totalRestante >= montoFactura - 0.01) {
        await invRepo.updateStatus(pay.factura_id, 'pagada');
      } else {
        await invRepo.updateStatus(pay.factura_id, 'pendiente');
      }
    }

    logger.info(`Pago ${id} eliminado, status de factura recalculado`);
  }
}

module.exports = PaymentService;
