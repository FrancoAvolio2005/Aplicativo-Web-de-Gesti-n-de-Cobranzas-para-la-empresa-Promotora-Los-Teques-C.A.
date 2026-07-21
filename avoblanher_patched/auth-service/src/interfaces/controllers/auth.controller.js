const AuthService    = require('../../application/services/AuthService');
const UserRepository = require('../../infrastructure/repositories/UserRepository');
const logger         = require('../../infrastructure/logger/logger');

const userRepository = new UserRepository();
const authService    = new AuthService(userRepository);

class AuthController {
  async register(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;
      const user = await authService.register({ nombre, email, password, rol });
      return res.status(201).json({ message: 'Usuario creado exitosamente', user });
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  // Registro público — solo crea clientes (ya no vincula tabla clients)
  // Registro público — solo crea clientes
async registerCliente(req, res) {
  try {
    // CAMBIO: Añadimos cedula y telefono a la extracción del body
    const { nombre, email, password, cedula, telefono } = req.body; 

    // Validación básica
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // CAMBIO: Pasamos cedula y telefono al servicio
    const user = await authService.registerCliente({ 
      nombre, 
      email, 
      password, 
      cedula, 
      telefono 
    });

    return res.status(201).json({ message: 'Cuenta creada exitosamente', user });
  } catch (e) { 
    return res.status(e.status || 500).json({ error: e.message }); 
  }
}

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return res.status(200).json(result);
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async loginPortal(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginPortal({ email, password });
      return res.status(200).json(result);
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return res.status(200).json(result);
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async logout(req, res) {
    try {
      await authService.logout(req.user.id);
      return res.status(200).json({ message: 'Sesión cerrada correctamente' });
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async getMe(req, res) {
    try {
      return res.status(200).json({ user: await authService.getMe(req.user.id) });
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  // GET /auth/clients — lista todos los usuarios con rol 'cliente'
  async getClients(req, res) {
    try {
      const clients = await authService.getAllClients();
      return res.status(200).json(clients);
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async toggleClientStatus(req, res) {
    try {
      const result = await authService.toggleClientStatus(req.params.id);
      return res.status(200).json({ message: `Cliente ${result.activo ? 'activado' : 'inactivado'} correctamente`, ...result });
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async verifyToken(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ valid: false, error: 'Token requerido' });
      const token   = authHeader.split(' ')[1];
      const payload = authService.verifyToken(token);
      return res.status(200).json({ valid: true, payload });
    } catch (e) { return res.status(401).json({ valid: false, error: e.message }); }
  }

  async verifyResetCode(req, res) {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: 'email y code son requeridos' });
      await authService.verifyResetCode(email, code);
      return res.status(200).json({ valid: true, message: 'Código válido' });
    } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email requerido' });
      await authService.requestPasswordReset(email);
      return res.status(200).json({ message: 'Código de recuperación enviado. Revisa tu correo.' });
    } catch (e) {
      logger.error(`forgotPassword: ${e.message}`);
      // Cambio #10: propagar el status (404 si no está registrado)
      return res.status(e.status || 500).json({ error: e.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'email, code y newPassword son requeridos' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      await authService.resetPassword(email, code, newPassword);
      return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (e) { logger.error(`resetPassword: ${e.message}`); return res.status(e.status || 500).json({ error: e.message }); }
  }
}

module.exports = new AuthController();
