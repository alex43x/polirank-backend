import Intento from '../../models/triesModel.js';
import Materia from '../../models/subjectModel.js';
import Alumno from '../../models/studentModel.js';
import { NotFoundError, ConflictError } from '../../shared/errors/httpErrors.js';
import AppError from '../../shared/errors/AppError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';

export async function getAllTries() {
  return Intento.findAndCountAll({
    order: [['id', 'ASC']],
    include: [{ model: Materia }, { model: Alumno }],
  });
}

export async function getTryById(id, userId) {
  const tryInstance = await Intento.findByPk(id);
  if (!tryInstance) throw new NotFoundError(ErrorCodes.TRY_NOT_FOUND.code, 'Intento no encontrado');

  if (tryInstance.alumno !== userId) {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permisos para ver este intento');
  }

  return tryInstance;
}

export async function createTry({ asignatura, valor }, alumnoId) {
  const subjectExists = await Materia.findByPk(asignatura);
  if (!subjectExists) throw new NotFoundError(ErrorCodes.SUBJECT_NOT_FOUND.code, 'La asignatura no existe');

  const existingTry = await Intento.findOne({ where: { alumno: alumnoId, asignatura } });
  if (existingTry) {
    throw new ConflictError(ErrorCodes.TRY_ALREADY_EXISTS.code, 'El intento ya existe para este alumno y asignatura');
  }

  return Intento.create({ alumno: alumnoId, asignatura, valor });
}

export async function updateTry(id, { asignatura, valor }, userId) {
  const tryInstance = await Intento.findByPk(id);
  if (!tryInstance) throw new NotFoundError(ErrorCodes.TRY_NOT_FOUND.code, 'Intento no encontrado');

  if (tryInstance.alumno !== userId) {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permisos para actualizar este intento');
  }

  await tryInstance.update({ asignatura, valor });
  return tryInstance;
}

export async function deleteTry(id, userId) {
  const tryInstance = await Intento.findByPk(id);
  if (!tryInstance) throw new NotFoundError(ErrorCodes.TRY_NOT_FOUND.code, 'Intento no encontrado');

  if (tryInstance.alumno !== userId) {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permisos para eliminar este intento');
  }

  await tryInstance.destroy();
}
