import { query } from 'express-validator';

export const getAllTeachersRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
  query('search').optional().isString().withMessage('search debe ser un texto'),
];
