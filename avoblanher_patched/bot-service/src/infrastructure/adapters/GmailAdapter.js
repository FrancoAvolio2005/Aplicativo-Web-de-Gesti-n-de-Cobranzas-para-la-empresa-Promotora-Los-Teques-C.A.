const nodemailer = require('nodemailer');
const logger     = require('../logger/logger');

/**
 * GmailAdapter — usa SMTP con App Password de Google.
 * No requiere Google Cloud ni OAuth2.
 * Solo necesita GMAIL_USER y GMAIL_PASS en el .env.
 *
 * Para obtener la clave de aplicación:
 * 1. Ir a myaccount.google.com/security
 * 2. Activar verificación en dos pasos
 * 3. Buscar "Contraseñas de aplicaciones"
 * 4. Crear una clave para "Correo" → copiar los 16 dígitos al .env
 */

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

// Crear el transporter SMTP una sola vez
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

class GmailAdapter {
  /**
   * Envía un correo HTML de aviso de cobro al cliente
   */
  async sendOverdueNotice({ to, clienteNombre, facturaId, montoVes, fechaVencimiento, tasaBcv }) {
    if (!GMAIL_USER || !GMAIL_PASS) {
      logger.warn('Gmail no configurado: faltan GMAIL_USER o GMAIL_PASS en .env');
      return { ok: false, error: 'Gmail no configurado' };
    }

    const montoUsd = tasaBcv
      ? `(≈ USD ${(montoVes / tasaBcv).toFixed(2)})`
      : '';

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><style>
        body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
        .card { background: #ffffff; border-radius: 16px; max-width: 540px; margin: 0 auto; overflow: hidden; }
        .header { background: #4f46e5; padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
        .header p  { color: #c7d2fe; margin: 6px 0 0; font-size: 14px; }
        .body { padding: 32px 40px; }
        .body p { color: #475569; line-height: 1.6; }
        .amount { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .amount .label { color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
        .amount .value { color: #0f172a; font-size: 32px; font-weight: 700; margin: 4px 0; }
        .amount .usd   { color: #64748b; font-size: 14px; }
        .btn { display: block; background: #4f46e5; color: #ffffff !important; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 24px 0 0; }
        .footer { background: #f8fafc; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 12px; }
      </style></head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Multiservicios AVOBLANHER C.A.</h1>
            <p>Aviso de cuenta pendiente</p>
          </div>
          <div class="body">
            <p>Estimado/a <strong>${clienteNombre}</strong>,</p>
            <p>Le informamos que tiene una factura vencida pendiente de pago. Le solicitamos regularizar su situación a la brevedad posible.</p>
            <div class="amount">
              <div class="label">Monto a cancelar</div>
              <div class="value">Bs. ${parseFloat(montoVes).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="usd">${montoUsd}</div>
            </div>
            <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento}</p>
            <p><strong>N° de factura:</strong> ${facturaId}</p>
            <p>Para notificar su pago o realizar consultas, ingrese a nuestro portal:</p>
            <a href="http://localhost:3000/portal" class="btn">Ir al Portal del Cliente →</a>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático. No responda a este correo.</p>
            <p>© ${new Date().getFullYear()} Multiservicios AVOBLANHER C.A. — Los Teques, Miranda, Venezuela</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from:    `"AVOBLANHER C.A." <${GMAIL_USER}>`,
        to,
        subject: '⚠️ Factura vencida pendiente — AVOBLANHER C.A.',
        html,
      });
      logger.info(`✉️  Correo enviado a ${to}`);
      return { ok: true };
    } catch (err) {
      logger.error(`Error enviando correo a ${to}: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Envía un correo de aviso cuando se crea una factura nueva al cliente
   */
  async sendNewInvoiceNotice({ to, clienteNombre, facturaId, descripcion, montoVes, fechaVencimiento, tasaBcv, empresaNombre }) {
    if (!GMAIL_USER || !GMAIL_PASS) {
      logger.warn('Gmail no configurado: faltan GMAIL_USER o GMAIL_PASS en .env');
      return { ok: false, error: 'Gmail no configurado' };
    }

    const montoUsd = tasaBcv
      ? `(≈ USD ${(montoVes / tasaBcv).toFixed(2)})`
      : '';

    const empresaLinea = empresaNombre
      ? `<p><strong>Empresa:</strong> ${empresaNombre}</p>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><style>
        body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
        .card { background: #ffffff; border-radius: 16px; max-width: 540px; margin: 0 auto; overflow: hidden; }
        .header { background: #4f46e5; padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
        .header p  { color: #c7d2fe; margin: 6px 0 0; font-size: 14px; }
        .body { padding: 32px 40px; }
        .body p { color: #475569; line-height: 1.6; }
        .badge { display: inline-block; background: #eef2ff; color: #4f46e5; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
        .amount { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .amount .label { color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
        .amount .value { color: #0f172a; font-size: 32px; font-weight: 700; margin: 4px 0; }
        .amount .usd   { color: #64748b; font-size: 14px; }
        .info-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 8px 0; font-size: 14px; color: #475569; }
        .info-row strong { color: #0f172a; }
        .btn { display: block; background: #4f46e5; color: #ffffff !important; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 24px 0 0; }
        .footer { background: #f8fafc; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 12px; }
      </style></head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Multiservicios AVOBLANHER C.A.</h1>
            <p>Nueva factura emitida a su nombre</p>
          </div>
          <div class="body">
            <span class="badge">📄 Factura Nueva</span>
            <p>Estimado/a <strong>${clienteNombre}</strong>,</p>
            <p>Le informamos que se ha emitido una nueva factura a su nombre. A continuación encontrará el detalle:</p>
            <div class="amount">
              <div class="label">Total a cancelar</div>
              <div class="value">Bs. ${parseFloat(montoVes).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              <div class="usd">${montoUsd}</div>
            </div>
            <div class="info-row"><span>N° de factura</span><strong>${facturaId}</strong></div>
            <div class="info-row"><span>Concepto</span><strong>${descripcion || 'Servicio mensual'}</strong></div>
            ${empresaNombre ? `<div class="info-row"><span>Empresa</span><strong>${empresaNombre}</strong></div>` : ''}
            <div class="info-row"><span>Fecha de vencimiento</span><strong>${fechaVencimiento}</strong></div>
            <p style="margin-top:20px;">Puede notificar su pago o realizar consultas desde nuestro portal:</p>
            <a href="http://localhost:3000/portal" class="btn">Ir al Portal del Cliente →</a>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático. No responda a este correo.</p>
            <p>© ${new Date().getFullYear()} Multiservicios AVOBLANHER C.A. — Los Teques, Miranda, Venezuela</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from:    `"AVOBLANHER C.A." <${GMAIL_USER}>`,
        to,
        subject: `📄 Nueva factura emitida — AVOBLANHER C.A. (Bs. ${parseFloat(montoVes).toLocaleString('es-VE', { minimumFractionDigits: 2 })})`,
        html,
      });
      logger.info(`✉️  Aviso de factura nueva enviado a ${to} (factura ${facturaId})`);
      return { ok: true };
    } catch (err) {
      logger.error(`Error enviando aviso de factura nueva a ${to}: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Verifica que la conexión SMTP funcione correctamente
   */
  async verify() {
    try {
      await transporter.verify();
      logger.info('✅ Conexión SMTP con Gmail verificada correctamente');
      return true;
    } catch (err) {
      logger.error(`❌ Error en conexión SMTP Gmail: ${err.message}`);
      return false;
    }
  }
}

module.exports = new GmailAdapter();