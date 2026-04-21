import { body, query } from 'express-validator';

// const FPUNA_DOMAIN = /^[^\s@]+@fpuna\.edu\.py$/i;

const correoFpuna = (field = 'correo') =>
  body(field)
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('El correo debe tener formato válido')
    // .matches(FPUNA_DOMAIN).withMessage('Solo se permiten correos @fpuna.edu.py')
    .normalizeEmail({ gmail_remove_dots: false });

export const loginRules = [
  correoFpuna(),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

export const forgotPasswordRules = [correoFpuna()];

export const verifyTokenRules = [
  query('token').notEmpty().withMessage('El token es requerido'),
];

export const resetPasswordRules = [
  body('token').notEmpty().withMessage('El token es requerido'),
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

export const registerRules = [
  body('token').notEmpty().withMessage('El token es requerido'),
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('carreras')
    .isArray({ min: 1, max: 2 }).withMessage('Seleccioná entre 1 y 2 carreras')
    .custom((arr) => arr.every(Number.isInteger)).withMessage('Las carreras deben ser IDs enteros'),
];
