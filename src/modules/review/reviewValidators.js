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
];
