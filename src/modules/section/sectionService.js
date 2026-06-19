import { Op } from 'sequelize';
import Section from '../../models/sectionModel.js';
import Curso from '../../models/courseModel.js';
import ReviewCab from '../../models/reviewCab.js';
import Aspecto from '../../models/aspectModel.js';
import { NotFoundError } from '../../shared/errors/httpErrors.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import {
  getLastCoursesBySection,
  getCourseAverage,
  totalReviewsForCourse,
  getStatsByCourse,
} from '../course/courseService.js';

export async function getSectionLastStats(sectionId) {
  const section = await Section.findByPk(sectionId);
  if (!section) throw new NotFoundError(ErrorCodes.SECTION_NOT_FOUND.code, 'Sección no encontrada');

  const lastCursos = await getLastCoursesBySection(section.id);
  if (!lastCursos || lastCursos.length === 0) {
    return { courses: [], stats: [], promedioGeneral: 0, totalReviews: 0 };
  }

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

  const statsMap = {};
  courseStats.forEach(({ stats }) => {
    stats.rows.forEach((stat) => {
      const aspectId = stat.aspecto;
      if (!statsMap[aspectId]) {
        statsMap[aspectId] = { aspecto: aspectId, promedio: 0, count: 0, aspect: stat.Aspecto };
      }
      statsMap[aspectId].promedio += parseFloat(stat.promedio);
      statsMap[aspectId].count += 1;
    });
  });

  const combinedStats = Object.values(statsMap).map((stat) => ({
    ...stat,
    promedio: (stat.promedio / stat.count).toFixed(2),
  }));

  const totalReviews = courseStats.reduce((acc, c) => acc + c.totalReviewsForCurso, 0);
  const totalAverage =
    totalReviews > 0
      ? courseStats.reduce(
          (acc, c) => acc + parseFloat(c.promedioGeneral) * c.totalReviewsForCurso,
          0,
        ) / totalReviews
      : 0;

  return { courses: lastCursos, stats: combinedStats, promedioGeneral: totalAverage, totalReviews };
}

export async function getSectionHistoryStats(sectionId) {
  const cursos = await Curso.findAndCountAll({ where: { seccion: sectionId } });

  const courseStats = await Promise.all(
    cursos.rows.map(async (curso) => {
      const [stats, average, totalReviews] = await Promise.all([
        getStatsByCourse(curso.id),
        getCourseAverage(curso.id),
        totalReviewsForCourse(curso.id),
      ]);
      return { curso, stats, promedioGeneral: average.result, totalReviews };
    }),
  );

  const totalAverage =
    cursos.count > 0
      ? courseStats.reduce((acc, c) => acc + parseFloat(c.promedioGeneral), 0) / cursos.count
      : 0;

  return { count: cursos.count, courseStats, totalPromedio: totalAverage };
}

export async function getCoursesBySection(sectionId) {
  return Curso.findAndCountAll({
    where: { seccion: sectionId },
    order: [
      ['year', 'DESC'],
      ['periodo', 'DESC'],
    ],
  });
}

export async function getReviewsBySection(sectionId) {
  const section = await Section.findByPk(sectionId);
  if (!section) throw new NotFoundError(ErrorCodes.SECTION_NOT_FOUND.code, 'Sección no encontrada');

  const cursos = await Curso.findAll({ where: { seccion: sectionId }, attributes: ['id'] });
  const cursosIds = cursos.map((c) => c.id);

  if (cursosIds.length === 0) return [];

  const reviews = await ReviewCab.findAll({
    where: { curso: { [Op.in]: cursosIds } },
    include: [
      { association: 'contenidos', include: [{ model: Aspecto, as: 'Aspecto' }] },
      { association: 'Alumno' },
      { association: 'Comentario', include: [{ association: 'votos' }] },
      {
        association: 'Curso',
        include: [{
          association: 'Seccion',
          include: [{ association: 'Docente' }, { association: 'Materia' }],
        }],
      },
    ],
    order: [['fecha', 'DESC']],
  });

  return reviews;
}
