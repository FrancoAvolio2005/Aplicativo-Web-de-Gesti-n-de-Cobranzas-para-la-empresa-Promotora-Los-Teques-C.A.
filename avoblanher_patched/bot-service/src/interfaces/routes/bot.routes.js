const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/bot.controller');

// ── Tasa BCV ──────────────────────────────────────────────────────────────────
router.get ('/currency/bcv',     ctrl.getCurrentRate);
router.get ('/currency/history', authenticate, ctrl.getRateHistory);
router.post('/currency/sync',    authenticate, authorize('admin'), ctrl.syncRate);

// ── Notificaciones en lote (cron/manual) ─────────────────────────────────────
router.get ('/notifications/history', authenticate, ctrl.getNotifications);
router.post('/notifications/send',    authenticate, authorize('admin'), ctrl.sendNotifications);

// ── Notificar una factura específica (desde InvoicesPage → botón "Enviar") ──
router.get ('/email-preview/:invoiceId', authenticate, authorize('admin','supervisor'), ctrl.emailPreview);
router.post('/notify/:invoiceId',        authenticate, authorize('admin','supervisor'), ctrl.notifyInvoice);

// ── Aviso automático de factura nueva al cliente ──────────────────────────────
router.post('/notify/new-invoice/:invoiceId', authenticate, authorize('admin','supervisor'), ctrl.notifyNewInvoice);

module.exports = router;
