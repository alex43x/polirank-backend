import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import Matriculacion from '../models/enrollmentModel.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Obtiene el token de autorizacion del user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw createError(401, 'No se proporcionó token');
    }

    const token = authHeader.split(' ')[1]; // Separa "Bearer" del token
    if (!token) {
      throw createError(401, 'Token inválido');
    }

    // Verifica token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guarda la info del usuario en la request

    // Leer carrera activa del header X-Carrera-Id
    const carreraId = req.headers['x-carrera-id'];
    
    // Si la carrera viene en el header, validar que el estudiante esté matriculado
    if (carreraId) {
      // Solo validar para estudiantes (no admin puede tener restricción)
      if (req.user.rol?.nombre !== 'ADMIN') {
        const matricula = await Matriculacion.findOne({
          where: {
            alumno: req.user.id,
            carrera: carreraId
          }
        });

        if (!matricula) {
          throw createError(403, 'No estás matriculado en esta carrera');
        }
      }
      
      req.carreraId = parseInt(carreraId);
    }

    next(); // Pasa al siguiente middleware o ruta
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      next(createError(401, 'Token inválido'));
    } else if (err.name === 'TokenExpiredError') {
      next(createError(401, 'Token expirado'));
    } else {
      next(err);
    }
  }
};

export default authMiddleware;
