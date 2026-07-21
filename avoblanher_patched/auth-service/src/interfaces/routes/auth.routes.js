const express = require('express');
const router  = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { registerValidators, loginValidators, refreshValidators } = require('../middlewares/validation.middleware');

// Registro de usuario admin/operador (solo admins)
router.post('/register',          authenticate, authorize('admin'), registerValidators, (req, res) => authController.register(req, res));

// Registro público de clientes
router.post('/register/cliente',  (req, res) => authController.registerCliente(req, res));

// Login
router.post('/login',             loginValidators, (req, res) => authController.login(req, res));
router.post('/login/portal',      loginValidators, (req, res) => authController.loginPortal(req, res));

// Token management
router.post('/refresh-token',     refreshValidators, (req, res) => authController.refreshToken(req, res));
router.delete('/logout',          authenticate, (req, res) => authController.logout(req, res));
router.get('/me',                 authenticate, (req, res) => authController.getMe(req, res));
router.get('/verify',             (req, res) => authController.verifyToken(req, res));

// Clientes registrados (para selección en panel admin)
router.get('/clients',            authenticate, authorize('admin','supervisor','operador'), (req, res) => authController.getClients(req, res));

// Activar / Inactivar cliente
router.patch('/clients/:id/toggle-status', authenticate, authorize('admin','supervisor'), (req, res) => authController.toggleClientStatus(req, res));

// Recuperación de contraseña
router.post('/forgot-password',     (req, res) => authController.forgotPassword(req, res));
router.post('/verify-reset-code',   (req, res) => authController.verifyResetCode(req, res));
router.post('/reset-password',      (req, res) => authController.resetPassword(req, res));

module.exports = router;
