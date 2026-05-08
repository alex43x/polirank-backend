import { query } from 'express-validator';

export const getAllSubjectsRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
  query('dpto_id').optional().isInt({ min: 1 }).withMessage('dpto_id debe ser un entero válido'),
  query('career_id').optional().isInt({ min: 1 }).withMessage('career_id debe ser un entero válido'),
  query('semester').optional().isInt({ min: 1 }).withMessage('semester debe ser un entero válido'),
];
