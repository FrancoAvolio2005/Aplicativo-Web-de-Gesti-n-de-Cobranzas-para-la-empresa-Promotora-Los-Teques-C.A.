const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/ia.controller');

// Multer en memoria (no guarda en disco)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// OCR
router.post('/ocr/validate', authenticate, upload.single('image'), ctrl.validateOcr);

// Risk
router.post('/risk/classify', authenticate, ctrl.classify);
router.get ('/risk/report',   authenticate, ctrl.getReport);
router.post('/risk/train',    authenticate, authorize('admin'), ctrl.retrain);

module.exports = router;
