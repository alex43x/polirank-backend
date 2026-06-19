import jwt from 'jsonwebtoken';
import Matriculacion from '../../models/enrollmentModel.js';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/httpErrors.js';
import { permissionsMap } from '../permissions/permissionsMap.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('auth_token_missing', 'No se proporcionó token');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('auth_token_invalid', 'Token inválido');
    }

    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;

    const carreraId = req.headers['x-carrera-id'];

    if (carreraId) {
      const role = req.user?.rol?.nombre;
      const canBypass = (permissionsMap[role] ?? []).includes('career:bypass_enrollment');

      if (!canBypass) {
        const matricula = await Matriculacion.findOne({
          where: { alumno: req.user.id, carrera: carreraId },
        });
        if (!matricula) {
          throw new UnauthorizedError('auth_carrera_not_enrolled', 'No estás matriculado en esta carrera');
        }
      }

      req.carreraId = parseInt(carreraId);
    }

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('auth_token_invalid', 'Token inválido'));
    } else if (err.name === 'TokenExpiredError') {
      next(new UnauthorizedError('auth_token_expired', 'Token expirado'));
    } else {
      next(err);
    }
  }
};

export default authMiddleware;
