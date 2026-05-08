import { permissionsMap } from './permissionsMap.js';
import AppError from '../errors/AppError.js';

export const requirePermission = (permission) => (req, res, next) => {
  const role = req.user?.rol?.nombre;
  const permissions = permissionsMap[role] ?? [];

  if (!permissions.includes(permission)) {
    return next(new AppError('insufficient_permissions', 403, 'No tienes permiso para esta acción'));
  }

  next();
};
