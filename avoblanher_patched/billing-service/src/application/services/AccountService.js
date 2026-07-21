const InvoiceRepository  = require('../../infrastructure/repositories/InvoiceRepository');
const PaymentRepository  = require('../../infrastructure/repositories/PaymentRepository');
const CompanyRepository  = require('../../infrastructure/repositories/CompanyRepository');
const bcvAdapter         = require('../../infrastructure/adapters/BcvAdapter');

const invRepo   = new InvoiceRepository();
const payRepo   = new PaymentRepository();
const compRepo  = new CompanyRepository();

class AccountService {
  /**
   * Resumen de cuenta para un cliente (por su user_id).
   * Filtra opcionalmente por company_id.
   */
  async getAccountSummary(userId, companyId = null, noCompany = false) {
    const empresas = await compRepo.findByUserId(userId);

    // Facturas filtradas por empresa si se indica
    const factQuery = { user_id: userId };
    if (noCompany) {
      factQuery.company_id = null; // Solo facturas sin empresa
    } else if (companyId) {
      factQuery.company_id = companyId;
    }
    const facturas = await invRepo.findAll(factQuery);

    // Pagos de TODAS las facturas del usuario (o filtradas por empresa)
    const facIds   = facturas.map(f => f.id);
    const allPagos = facIds.length > 0 ? await payRepo.findByFacturaIds(facIds) : [];

    const tasa = await bcvAdapter.getCurrentRate();

    const pendientes = facturas.filter(f => ['pendiente', 'vencida', 'mora'].includes(f.status));

    // Calcular deuda real: para cada factura pendiente, restar los abonos ya realizados
    const totalDeudaVes = pendientes.reduce((s, f) => {
      const pagosFactura = allPagos.filter(p => String(p.factura_id) === String(f.id));
      const totalAbonado = pagosFactura.reduce((a, p) => a + parseFloat(p.monto_ves || 0), 0);
      const saldoFactura = Math.max(0, parseFloat(f.monto_ves || 0) - totalAbonado);
      return s + saldoFactura;
    }, 0);
    const totalDeudaUsd = tasa ? parseFloat((totalDeudaVes / tasa).toFixed(2)) : null;

    const ultimoPago    = [...allPagos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    // Cambio #1: ultimo_mes = suma total de pagos realizados en el mes actual
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();
    const totalMesActual = allPagos
      .filter(p => {
        const d = new Date(p.fecha_pago);
        return d.getMonth() === mesActual && d.getFullYear() === anioActual;
      })
      .reduce((s, p) => s + parseFloat(p.monto_ves || 0), 0);

    return {
      empresas,
      resumen: {
        total_deuda_ves:    totalDeudaVes.toFixed(2),
        total_deuda_usd:    totalDeudaUsd,
        tasa_bcv:           tasa,
        facturas_pendientes: pendientes.length,
        ultimo_mes:  totalMesActual.toFixed(2),
        ultimo_pago: ultimoPago ? {
          monto_ves: parseFloat(ultimoPago.monto_ves).toFixed(2),
          fecha:     ultimoPago.fecha_pago,
          metodo:    ultimoPago.metodo_pago,
        } : null,
      },
      facturas,
      pagos: allPagos,
    };
  }
}

module.exports = AccountService;
