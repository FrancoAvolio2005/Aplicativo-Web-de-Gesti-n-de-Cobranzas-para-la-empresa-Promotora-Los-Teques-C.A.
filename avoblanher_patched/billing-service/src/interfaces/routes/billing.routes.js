const express     = require('express');
const router      = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload }  = require('../../infrastructure/adapters/UploadAdapter');
const companyCtrl = require('../controllers/company.controller');
const invoiceCtrl = require('../controllers/invoice.controller');
const paymentCtrl = require('../controllers/payment.controller');
const accountCtrl = require('../controllers/account.controller');

// ── Companies ─────────────────────────────────────────────────────────────────
router.get   ('/companies',                  authenticate, companyCtrl.getAll);
router.get   ('/companies/by-user/:userId',  authenticate, companyCtrl.getByUserId);
router.get   ('/companies/:id',              authenticate, companyCtrl.getById);
router.post  ('/companies',                  authenticate, authorize('admin','supervisor'), companyCtrl.create);
router.put   ('/companies/:id',              authenticate, authorize('admin','supervisor'), companyCtrl.update);
router.patch ('/companies/:id/deactivate',   authenticate, authorize('admin','supervisor'), companyCtrl.deactivate);
router.patch ('/companies/:id/activate',     authenticate, authorize('admin','supervisor'), companyCtrl.activate);

// ── Invoices ──────────────────────────────────────────────────────────────────
router.get   ('/invoices',                   authenticate, invoiceCtrl.getAll);
router.get   ('/invoices/overdue',           authenticate, invoiceCtrl.getOverdue);
router.get   ('/invoices/:id',               authenticate, invoiceCtrl.getById);
router.post  ('/invoices',                   authenticate, authorize('admin','supervisor'), invoiceCtrl.create);
router.put   ('/invoices/:id',               authenticate, authorize('admin','supervisor'), invoiceCtrl.update);
router.patch ('/invoices/:id/status',        authenticate, authorize('admin','supervisor'), invoiceCtrl.updateStatus);
router.delete('/invoices/:id',               authenticate, authorize('admin'), invoiceCtrl.delete);
// Agrega esto en tu billing.routes.js
router.post('/invoices/:id/notify', authenticate, authorize('admin','supervisor'), invoiceCtrl.notifyClient);

// ── Payments ──────────────────────────────────────────────────────────────────
router.get   ('/payments',                   authenticate, paymentCtrl.getAll);
router.get   ('/payments/last7days',         authenticate, paymentCtrl.getLast7Days);
router.get   ('/payments/:id/comprobante',   authenticate, paymentCtrl.getComprobante);
router.post  ('/payments',                   authenticate, upload.single('comprobante'), paymentCtrl.create);
router.delete('/payments/:id',               authenticate, authorize('admin'), paymentCtrl.delete);

// ── Accounts ──────────────────────────────────────────────────────────────────
router.get('/accounts/:userId',              authenticate, accountCtrl.getAccount);
router.get('/accounts/me',                   authenticate, accountCtrl.getMyAccount);

module.exports = router;