import Curso from '../../models/courseModel.js';
import Stats from '../../models/statsModel.js';
import Aspecto from '../../models/aspectModel.js';
import ReviewCab from '../../models/reviewCab.js';

export const getLastCourseBySection = (seccionId) => {
  return Curso.findOne({
    where: { seccion: seccionId },
    order: [['year', 'DESC'], ['periodo', 'DESC']],
  });
};

export const getLastCoursesBySection = async (seccionId) => {
  return Curso.findAll({
    where: { seccion: seccionId },
    order: [['year', 'DESC'], ['periodo', 'DESC']],
    limit: 2,
  });
};

export const getStatsByCourse = async (courseId) => {
  return Stats.findAndCountAll({
    where: { curso: courseId },
    include: [{ association: 'Aspecto' }],
    order: [['aspecto', 'ASC']],
  });
};

export const getCourseAverage = async (courseId) => {
  const stats = await getStatsByCourse(courseId);
  const sum = stats.rows.reduce((acc, stat) => acc + parseFloat(stat.promedio), 0);
  const result = stats.count > 0 ? (sum / stats.count).toFixed(2) : 0;
  return result === 'NaN' ? { result: 0 } : { result };
};

export const totalReviewsForCourse = async (courseId) => {
  return ReviewCab.count({ where: { curso: courseId } });
};
