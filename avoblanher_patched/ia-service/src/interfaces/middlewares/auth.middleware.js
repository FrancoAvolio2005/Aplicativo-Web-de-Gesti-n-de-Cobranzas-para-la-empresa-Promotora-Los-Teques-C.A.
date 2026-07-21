const jwt = require('jsonwebtoken');
const authenticate = (req, res, next) => {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
  try { req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Token inválido' }); }
};
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol))
    return res.status(403).json({ error: 'Sin permisos' });
  next();
};
module.exports = { authenticate, authorize };
