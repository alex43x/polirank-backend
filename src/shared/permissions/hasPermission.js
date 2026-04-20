import { permissionsMap } from './permissionsMap.js';

export const hasPermission = (req, permission) => {
  const role = req.user?.rol?.nombre;
  return (permissionsMap[role] ?? []).includes(permission);
};
