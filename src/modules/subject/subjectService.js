import { Op } from 'sequelize';
import Subject from '../../models/subjectModel.js';
import Section from '../../models/sectionModel.js';
import Malla from '../../models/curriculumModel.js';
import Docente from '../../models/teacherModel.js';
import Departamento from '../../models/departmentModel.js';
import Intento from '../../models/triesModel.js';
import { NotFoundError } from '../../shared/errors/httpErrors.js';
import AppError from '../../shared/errors/AppError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import {
  getLastCoursesBySection,
  getCourseAverage,
  totalReviewsForCourse,
  getStatsByCourse,
} from '../course/courseService.js';

async function getSubjectIdsByCurriculum(careerId = null, semester = null) {
  const where = {};
  if (careerId !== null) where.carrera = careerId;
  if (semester !== null) where.semestre = semester;

  const mallas = await Malla.findAndCountAll({ where });
  if (mallas.count === 0) return null;

  return mallas.rows.map((malla) => malla.asignatura);
}

export async function getAllSubjects({ page = 1, limit = 10, search, dpto_id, career_id, semester }, currentUser, carreraId) {
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [{ nombre: { [Op.iLike]: `%${search}%` } }];
  }

  switch (currentUser.rol.nombre) {
    case 'ADMIN':
      if (career_id || semester) {
        const subjectIds = await getSubjectIdsByCurriculum(career_id, semester);
        if (!subjectIds) return { count: 0, rows: [] };
        where.id = { [Op.in]: subjectIds };
      }
      break;

    case 'STUDENT':
    case 'GUEST':
      if (!carreraId) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR.code, 400, 'Se requiere X-Carrera-Id header');
      }
      const subjectIds = await getSubjectIdsByCurriculum(carreraId, semester);
      if (!subjectIds) return { count: 0, rows: [] };
      where.id = { [Op.in]: subjectIds };
      break;

    default:
      return { count: 0, rows: [] };
  }

  if (dpto_id) where.depto = dpto_id;

  return Subject.findAndCountAll({
    where,
    include: [{ model: Departamento }],
    order: [['id', 'ASC']],
    limit,
    offset,
  });
}

export async function getSubjectById(id, currentUser, carreraId) {
  if (['STUDENT', 'GUEST'].includes(currentUser.rol.nombre)) {
    if (!carreraId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR.code, 400, 'Se requiere X-Carrera-Id header');
    }
    const subjectIds = await getSubjectIdsByCurriculum(carreraId);
    if (!subjectIds || !subjectIds.includes(parseInt(id))) {
      throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permisos para ver esta materia');
    }
  } else if (currentUser.rol.nombre !== 'ADMIN') {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permisos para ver materias');
  }

  const subject = await Subject.findByPk(id, { include: [{ model: Departamento }] });
  if (!subject) throw new NotFoundError(ErrorCodes.SUBJECT_NOT_FOUND.code, 'Materia no encontrada');

  return subject;
}

export async function getSectionsBySubjectId(id, currentUser, carreraId) {
  if (['STUDENT', 'GUEST'].includes(currentUser.rol.nombre)) {
    if (!carreraId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR.code, 400, 'Se requiere X-Carrera-Id header');
    }
    const subjectIds = await getSubjectIdsByCurriculum(carreraId);
    if (!subjectIds || !subjectIds.includes(parseInt(id))) {
      throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permisos para ver las secciones de esta materia');
    }
  } else if (currentUser.rol.nombre !== 'ADMIN') {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permisos para ver secciones');
  }

  return Section.findAll({
    where: { asignatura: id },
    include: [{ model: Docente }],
  });
}

export async function getSectionsStatsBySubjectId(id) {
  const sections = await Section.findAll({
    where: { asignatura: id },
    include: [{ model: Docente }],
  });

  const sectionsWithAverage = [];

  for (const section of sections) {
    const lastCursos = await getLastCoursesBySection(section.id);
    if (!lastCursos || lastCursos.length === 0) continue;

    const courseStats = await Promise.all(
      lastCursos.map(async (curso) => {
        const [stats, average, totalReviewsForCurso] = await Promise.all([
          getStatsByCourse(curso.id),
          getCourseAverage(curso.id),
          totalReviewsForCourse(curso.id),
        ]);
        return { curso, stats, promedioGeneral: average.result, totalReviewsForCurso };
      }),
    );

    const totalReviews = courseStats.reduce((acc, c) => acc + c.totalReviewsForCurso, 0);
    const totalAverage =
      totalReviews > 0
        ? courseStats.reduce(
            (acc, c) => acc + parseFloat(c.promedioGeneral) * c.totalReviewsForCurso,
            0,
          ) / totalReviews
        : 0;

    sectionsWithAverage.push({
      section,
      promedioGeneral: totalAverage,
      totalReviews,
    });
  }

  sectionsWithAverage.sort((a, b) => b.promedioGeneral - a.promedioGeneral);
  return sectionsWithAverage;
}

export async function getSubjectTriesStats(subjectId) {
  const intentos = await Intento.findAll({ where: { asignatura: subjectId } });

  const emptyStats = { '1_intento': 0, '2_intentos': 0, '3_intentos': 0, 'mas_intentos': 0 };

  if (intentos.length === 0) return emptyStats;

  const studentTriesMap = {};
  for (const intento of intentos) {
    if (!studentTriesMap[intento.alumno]) {
      studentTriesMap[intento.alumno] = intento.valor;
    } else {
      studentTriesMap[intento.alumno] = Math.max(studentTriesMap[intento.alumno], intento.valor);
    }
  }

  const triesStats = { ...emptyStats };
  Object.values(studentTriesMap).forEach((valor) => {
    if (valor === 1) triesStats['1_intento']++;
    else if (valor === 2) triesStats['2_intentos']++;
    else if (valor === 3) triesStats['3_intentos']++;
    else triesStats['mas_intentos']++;
  });

  return triesStats;
}
