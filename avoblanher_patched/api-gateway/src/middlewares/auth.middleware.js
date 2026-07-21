const jwt    = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Middleware de autenticación del gateway.
 * Verifica JWT antes de hacer proxy. Las rutas públicas se eximen.
 */

// Rutas que NO requieren token
const PUBLIC_PATHS = [
  // Auth
  { method: 'POST', path: '/api/auth/login'              },
  { method: 'POST', path: '/api/auth/login/portal'       },
  { method: 'POST', path: '/api/auth/refresh-token'      },
  { method: 'POST', path: '/api/auth/register/cliente'   }, // registro público
  { method: 'POST', path: '/api/auth/forgot-password'    },
  { method: 'POST', path: '/api/auth/verify-reset-code'  },
  { method: 'POST', path: '/api/auth/reset-password'     },
  // Bot / utilidades
  { method: 'GET',  path: '/api/currency/bcv'            },
  { method: 'GET',  path: '/health'                      },
];

function isPublic(req) {
  return PUBLIC_PATHS.some(p =>
    p.method === req.method && req.path.startsWith(p.path)
  );
}

const authenticate = (req, res, next) => {
  if (isPublic(req)) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    logger.info(`Gateway: ${req.method} ${req.path} — ${payload.email} (${payload.rol})`);
    next();
  } catch (err) {
    logger.warn(`Gateway: token inválido en ${req.path} — ${err.message}`);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = authenticate;
