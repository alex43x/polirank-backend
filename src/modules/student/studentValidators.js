import { body } from 'express-validator';

export const createStudentRules = [
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .trim(),
  body('correo')
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('El correo debe tener formato válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol')
    .notEmpty().withMessage('El rol es requerido')
    .isInt({ min: 1 }).withMessage('El rol debe ser un entero válido'),
  body('matriculaciones')
    .optional()
    .isArray().withMessage('Las matriculaciones deben ser un array')
    .custom((arr) => arr.every(Number.isInteger)).withMessage('Cada matriculación debe ser un entero'),
];

export const updateStudentRules = [
  body('nombre')
    .optional()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isString().withMessage('El nombre debe ser texto')
    .trim(),
  body('correo')
    .optional()
    .notEmpty().withMessage('El correo no puede estar vacío')
    .isEmail().withMessage('El correo debe tener formato válido')
    .normalizeEmail(),
];
