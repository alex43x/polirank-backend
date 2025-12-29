import createError from 'http-errors';
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
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
