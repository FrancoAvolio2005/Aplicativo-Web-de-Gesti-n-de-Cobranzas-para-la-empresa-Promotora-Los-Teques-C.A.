const jwt = require('jsonwebtoken');
const logger = require('../../infrastructure/logger/logger');

/**
 * Middleware de autenticación JWT.
 * Verifica el token Bearer en el header Authorization.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, rol }
    next();
  } catch (error) {
    logger.warn(`Token inválido: ${error.message}`);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware de autorización por roles (RBAC).
 * Uso: authorize('admin') o authorize('admin', 'supervisor')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      logger.warn(`Acceso denegado: usuario ${req.user.email} (${req.user.rol}) intentó acceder a recurso restringido`);
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción',
        required: roles,
        current: req.user.rol,
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
