const { body, validationResult } = require('express-validator');

/**
 * Ejecuta los resultados de express-validator y retorna 422 si hay errores.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ 
      error: 'Datos de entrada inválidos',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerValidators = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('El email no tiene un formato válido'),
    // NOTA: NO usar .normalizeEmail() — transforma puntos en Gmail (p.ej. "john.doe@gmail.com" → "johndoe@gmail.com")
    // La normalización (toLowerCase + trim) se hace manualmente en AuthService.
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe tener al menos una mayúscula, una minúscula y un número'),
  
  body('rol')
    .optional()
    .isIn(['admin', 'supervisor', 'operador', 'cliente']).withMessage('Rol inválido'),
  
  validate,
];

const loginValidators = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Formato de email inválido'),
    // NOTA: NO usar .normalizeEmail() — transforma puntos en Gmail (p.ej. "john.doe@gmail.com" → "johndoe@gmail.com")
    // La normalización (toLowerCase + trim) se hace manualmente en AuthService.login().
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
  
  validate,
];

const refreshValidators = [
  body('refreshToken')
    .notEmpty().withMessage('El refresh token es requerido'),
  
  validate,
];

module.exports = { registerValidators, loginValidators, refreshValidators, validate };
