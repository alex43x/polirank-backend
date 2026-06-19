import { validationResult } from 'express-validator';
import { ValidationError } from '../errors/httpErrors.js';
import { ErrorCodes } from '../errors/errorCodes.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path,
      code: 'invalid_value',
      message: err.msg,
    }));
    return next(new ValidationError(ErrorCodes.VALIDATION_ERROR.code, 'Error de validación', details));
  }
  next();
};
