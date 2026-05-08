import { body } from 'express-validator';

export const createTryRules = [
  body('asignatura')
    .notEmpty().withMessage('La asignatura es requerida')
    .isInt({ min: 1 }).withMessage('La asignatura debe ser un entero válido'),
  body('valor')
    .notEmpty().withMessage('El valor es requerido')
    .isInt({ min: 1 }).withMessage('El valor debe ser un entero positivo'),
];

export const updateTryRules = [
  body('asignatura').optional().isInt({ min: 1 }).withMessage('La asignatura debe ser un entero válido'),
  body('valor').optional().isInt({ min: 1 }).withMessage('El valor debe ser un entero positivo'),
];
