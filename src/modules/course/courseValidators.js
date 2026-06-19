import { query } from 'express-validator';

export const listCoursesRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100'),
];
