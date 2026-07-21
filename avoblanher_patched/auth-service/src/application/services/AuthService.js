const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const logger     = require('../../infrastructure/logger/logger');

const SALT_ROUNDS    = 12;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES  || '15m';
const REFRESH_EXPIRES= process.env.JWT_REFRESH_EXPIRES || '7d';
const RESET_TTL_MS   = 10 * 60 * 1000; // 10 minutos

// Transporter lazily construido para no fallar si las env no están presentes al arrancar
let _transporter = null;
function getTransporter() {
  if (!_transporter && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });
  }
  return _transporter;
}

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  _generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );
  }

  _generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_EXPIRES }
    );
  }

  _generateServiceToken() {
    return jwt.sign(
      { id: 'auth-service', email: 'internal@avoblanher.com', rol: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '2m' }
    );
  }

  // ── UC-01: Registro admin/operador (solo panel admin) ─────────────────────
  async register({ nombre, email, password, rol = 'operador' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) { const e = new Error('El email ya está registrado'); e.status = 409; throw e; }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userRepository.create({ nombre, email: normalizedEmail, password: hashedPassword, rol });
    logger.info(`Usuario registrado: ${normalizedEmail} [${rol}]`);
    return user.toPublic();
  }

// ── UC-01b: Registro público de clientes ──────────────────────────────────
async registerCliente({ nombre, email, password, cedula, telefono }) { // <--- 1. Agregamos los campos aquí
    // 1. Normalización
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Buscamos usando el correo normalizado
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) { 
        const e = new Error('Ya existe una cuenta con ese correo electrónico'); 
        e.status = 409; 
        throw e; 
    }

    // 3. Hasheamos la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Creamos el usuario con TODOS los campos
    const user = await this.userRepository.create({ 
        nombre, 
        email: normalizedEmail,
        password: hashedPassword, 
        rol: 'cliente',
        cedula,   // <--- 2. Agregamos la cédula para que no sea null
        telefono  // <--- 3. Agregamos el teléfono para que no sea null
    });

    logger.info(`Cliente registrado públicamente: ${normalizedEmail}`);
    return user.toPublic();
}

  // ── UC-02: Login unificado ────────────────────────────────────────────────
async login({ email, password }) {
  // 1. Normalización: Forzamos minúsculas y quitamos espacios
  const normalizedEmail = email.toLowerCase().trim();

  // 2. Buscamos usando el email normalizado
  const user = await this.userRepository.findByEmail(normalizedEmail);
  
  if (!user) { 
    const e = new Error('Credenciales inválidas'); 
    e.status = 401; 
    throw e; 
  }
  
  if (!user.activo) { 
    const e = new Error('Cuenta desactivada. Contacte al administrador.'); 
    e.status = 403; 
    throw e; 
  }

  // 3. Comparación de contraseña
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) { 
    const e = new Error('Credenciales inválidas'); 
    e.status = 401; 
    throw e; 
  }

  // 4. Generación de tokens
  const accessToken  = this._generateAccessToken(user);
  const refreshToken = this._generateRefreshToken(user);
  await this.userRepository.saveRefreshToken(user.id, refreshToken);

  logger.info(`Login exitoso: ${normalizedEmail} [${user.rol}]`);
  
  const redirectTo = user.rol === 'cliente' ? '/portal' : '/dashboard';
  return { accessToken, refreshToken, user: user.toPublic(), redirectTo };
}

  async loginPortal({ email, password }) {
  const result = await this.login({ email, password });
  
  // Limpiamos el rol de cualquier espacio o diferencia de formato
  const userRol = result.user.rol ? String(result.user.rol).trim().toLowerCase() : '';

  if (userRol !== 'cliente') {
    // Si no es cliente, limpiamos el token por seguridad
    await this.userRepository.clearRefreshToken(result.user.id);
    
    // LOG DE DEBUG (Aparecerá en tu terminal de VS Code)
    console.log(`[AUTH DEBUG] Intento de acceso al portal fallido. Email: ${email}, Rol detectado: "${userRol}"`);
    
    const e = new Error('Acceso denegado. Este portal es exclusivo para clientes.'); 
    e.status = 403; 
    throw e;
  }
  
  return result;
}

  async refreshToken(token) {
    if (!token) { const e = new Error('Refresh token requerido'); e.status = 401; throw e; }
    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch { const err = new Error('Refresh token inválido o expirado'); err.status = 401; throw err; }
    const user = await this.userRepository.findByRefreshToken(token);
    if (!user) { const e = new Error('Sesión no encontrada. Inicia sesión nuevamente.'); e.status = 401; throw e; }
    const newAccessToken = this._generateAccessToken(user);
    logger.info(`Token renovado: ${user.email}`);
    return { accessToken: newAccessToken };
  }

  async logout(userId) {
    await this.userRepository.clearRefreshToken(userId);
    logger.info(`Logout: usuario ${userId}`);
  }

  async getMe(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) { const e = new Error('Usuario no encontrado'); e.status = 404; throw e; }
    return user.toPublic();
  }

  async getAllClients() {
    return this.userRepository.findAllByRol('cliente');
  }

  async toggleClientStatus(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) { const e = new Error('Cliente no encontrado'); e.status = 404; throw e; }
    if (user.rol !== 'cliente') { const e = new Error('Solo se puede cambiar el estado de clientes'); e.status = 422; throw e; }
    const nuevoEstado = !user.activo;
    await this.userRepository.update(userId, { activo: nuevoEstado });
    logger.info(`Cliente ${userId} ${nuevoEstado ? 'activado' : 'inactivado'}`);
    return { id: userId, activo: nuevoEstado };
  }

  verifyToken(token) {
    try { return jwt.verify(token, process.env.JWT_SECRET); }
    catch { const err = new Error('Token inválido o expirado'); err.status = 401; throw err; }
  }

  // ── UC-05: Recuperación de contraseña ──────────────────────────────────────
  async requestPasswordReset(email) {
    const user = await this.userRepository.findByEmail(email);
    // Cambio #10: informar al usuario si el correo no está registrado
    if (!user) {
      logger.warn(`Reset solicitado para email no registrado: ${email}`);
      const e = new Error('Este correo no está registrado en el sistema.');
      e.status = 404;
      throw e;
    }

    const code      = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);
    await this.userRepository.saveResetCode(user.id, code, expiresAt);

    const transport = getTransporter();
    if (transport) {
      try {
        await transport.sendMail({
          from:    `"AVOBLANHER C.A." <${process.env.GMAIL_USER}>`,
          to:      email,
          subject: 'Código de recuperación de contraseña – AVOBLANHER',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px">
              <div style="text-align:center;margin-bottom:24px">
                <div style="display:inline-block;background:#4f46e5;padding:12px 24px;border-radius:12px;color:white;font-size:18px;font-weight:700">
                  AVOBLANHER C.A.
                </div>
              </div>
              <h2 style="color:#1e293b;text-align:center">Recuperación de contraseña</h2>
              <p style="color:#475569;text-align:center">Usa el siguiente código para restablecer tu contraseña:</p>
              <div style="font-size:48px;font-weight:800;letter-spacing:14px;color:#4f46e5;text-align:center;
                          padding:28px;background:#fff;border-radius:16px;border:2px solid #e2e8f0;
                          margin:20px 0">${code}</div>
              <p style="color:#64748b;font-size:13px;text-align:center">
                Este código expira en <strong>10 minutos</strong>.<br/>
                Si no solicitaste esto, ignora este correo.
              </p>
            </div>`,
        });
        logger.info(`Código de reset enviado a: ${email}`);
      } catch (mailErr) {
        logger.error(`Error enviando email de reset: ${mailErr.message}`);
        // No lanzamos error: el código ya fue guardado aunque el email falle
      }
    } else {
      logger.warn('GMAIL no configurado — código generado pero no enviado');
    }
  }

  // ── UC-05b: Verificar código sin cambiar contraseña ────────────────────────
  async verifyResetCode(email, code) {
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) { const e = new Error('Email no registrado'); e.status = 404; throw e; }
    const raw = await this.userRepository.findRawById(user.id);
    if (!raw?.reset_code) {
      const e = new Error('No hay código de recuperación activo. Solicita uno nuevo.'); e.status = 400; throw e;
    }
    if (String(raw.reset_code).trim() !== String(code).trim()) {
      const e = new Error('Código inválido'); e.status = 400; throw e;
    }
    if (new Date() > new Date(raw.reset_code_expires)) {
      const e = new Error('El código ha expirado. Solicita uno nuevo.'); e.status = 400; throw e;
    }
    return true;
  }

  async resetPassword(email, code, newPassword) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) { const e = new Error('Email no registrado'); e.status = 404; throw e; }

    const raw = await this.userRepository.findRawById(user.id);
    if (!raw?.reset_code) {
      const e = new Error('No hay código de recuperación activo. Solicita uno nuevo.'); e.status = 400; throw e;
    }

    // IMPORTANTE: comparación estricta del código
    if (String(raw.reset_code).trim() !== String(code).trim()) {
      const e = new Error('Código inválido'); e.status = 400; throw e;
    }

    if (new Date() > new Date(raw.reset_code_expires)) {
      const e = new Error('El código ha expirado. Solicita uno nuevo.'); e.status = 400; throw e;
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userRepository.updatePassword(user.id, hashed);
    await this.userRepository.clearResetCode(user.id);
    logger.info(`Contraseña restablecida para: ${email}`);
  }
}

module.exports = AuthService;
