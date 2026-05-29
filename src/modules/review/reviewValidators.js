import { body } from 'express-validator';

export const createReviewRules = [
  body('curso')
    .notEmpty().withMessage('El curso es requerido')
    .isInt({ min: 1 }).withMessage('El curso debe ser un entero válido'),
  body('aspectos')
    .notEmpty().withMessage('Los aspectos son requeridos')
    .isArray({ min: 1 }).withMessage('Debe incluir al menos un aspecto'),
  body('aspectos.*.aspecto')
    .notEmpty().withMessage('Cada aspecto debe tener un id')
    .isInt({ min: 1 }).withMessage('El id de aspecto debe ser un entero válido'),
  body('aspectos.*.valor')
    .notEmpty().withMessage('Cada aspecto debe tener un valor')
    .isInt({ min: 1, max: 5 }).withMessage('El valor debe estar entre 1 y 5'),
  body('texto')
    .optional()
    .isString().withMessage('El texto debe ser una cadena')
    .isLength({ max: 1000 }).withMessage('El texto no puede superar los 1000 caracteres'),
];

export const comentarioRules = [
  body('texto')
    .notEmpty().withMessage('El texto es requerido')
    .isString().withMessage('El texto debe ser una cadena')
    .isLength({ max: 1000 }).withMessage('El texto no puede superar los 1000 caracteres'),
];

export const votoComentarioRules = [
  body('valor')
    .notEmpty().withMessage('El valor es requerido')
    .isInt({ min: -1, max: 1 }).withMessage('El valor debe ser -1 o 1')
    .custom((v) => v !== 0).withMessage('El valor debe ser -1 o 1'),
];

export const reporteComentarioRules = [
  body('reason_type')
    .notEmpty().withMessage('El motivo del reporte es requerido')
    .isString().withMessage('El motivo debe ser una cadena')
    .isLength({ max: 100 }).withMessage('El motivo no puede superar los 100 caracteres'),
  body('reason_detail')
    .optional()
    .isString().withMessage('El detalle debe ser una cadena')
    .isLength({ max: 500 }).withMessage('El detalle no puede superar los 500 caracteres'),
];
