import AppError from '../errors/AppError.js';
import { env } from '../../config/env.js';

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
  }

  console.error(err);

  return res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Error interno',
      ...(env.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
};

export default errorHandler;
