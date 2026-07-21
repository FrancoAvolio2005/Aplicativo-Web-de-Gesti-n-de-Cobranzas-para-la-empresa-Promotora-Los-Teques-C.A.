/**
 * Middleware de autorización por roles en el Gateway.
 * Implementa una comparación flexible para evitar errores por "/" al final
 * y asegura que el rol 'cliente' tenga acceso a la creación de pagos.
 */
const ROLE_RULES = [
  // Auth — rutas admin
  { method: 'POST',   path: '/api/auth/register',       roles: ['admin'] },
  { method: 'DELETE', path: '/api/auth/logout',         roles: ['admin','supervisor','operador','cliente'] },

  // Billing — clientes
  { method: 'POST',   path: '/api/clients',             roles: ['admin','supervisor'] },
  { method: 'PUT',    path: '/api/clients',             roles: ['admin','supervisor'] },
  { method: 'DELETE', path: '/api/clients',             roles: ['admin'] },
  { method: 'PATCH',  path: '/api/clients',             roles: ['admin','supervisor'] },

  // Billing — facturas
  { method: 'POST',   path: '/api/invoices',            roles: ['admin','supervisor'] },
  { method: 'PUT',    path: '/api/invoices',            roles: ['admin','supervisor'] },
  { method: 'PATCH',  path: '/api/invoices',            roles: ['admin','supervisor'] },
  { method: 'DELETE', path: '/api/invoices',            roles: ['admin'] },

  // Billing — pagos (ROL CLIENTE HABILITADO)
  { method: 'POST',   path: '/api/payments',            roles: ['admin', 'supervisor', 'operador', 'cliente'] },
  { method: 'GET',    path: '/api/payments',            roles: ['admin', 'supervisor', 'operador', 'cliente'] },
  { method: 'DELETE', path: '/api/payments',            roles: ['admin'] },

  // IA
  { method: 'POST',   path: '/api/risk/train',          roles: ['admin'] },
  { method: 'POST',   path: '/api/risk/classify',       roles: ['admin','supervisor','operador'] },
  { method: 'POST',   path: '/api/ocr/validate',        roles: ['admin','supervisor','operador','cliente'] },

  // Bot — solo admin puede disparar manualmente
  { method: 'POST',   path: '/api/currency/sync',       roles: ['admin'] },
  { method: 'POST',   path: '/api/notifications/send',  roles: ['admin'] },
];

const authorize = (req, res, next) => {
  // 1. Si no hay usuario, es una ruta pública o el auth falló antes
  if (!req.user) return next();

  // 2. Limpieza de ruta actual (quita el "/" final si existe para comparar bien)
  const currentPath = req.path.replace(/\/$/, "") || "/";

  // 3. Buscar regla que coincida con método y ruta
  const matchedRule = ROLE_RULES.find(rule => {
    const rulePath = rule.path.replace(/\/$/, "") || "/";
    return rule.method === req.method && currentPath === rulePath;
  });

  // 4. Si no hay regla específica, permitimos pasar (configuración por defecto abierta)
  if (!matchedRule) return next();

  // 5. Verificación de Rol
  if (!matchedRule.roles.includes(req.user.rol)) {
    console.log(`🚫 Acceso Denegado: [${req.user.rol}] intentó ${req.method} en ${currentPath}`);
    
    return res.status(403).json({
      error: 'Sin permisos para esta acción',
      required: matchedRule.roles,
      current: req.user.rol || 'sin-rol'
    });
  }

  // 6. Si todo está OK, pasamos al siguiente middleware (el proxy)
  next();
};

module.exports = authorize;