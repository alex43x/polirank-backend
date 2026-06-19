import { Op } from "sequelize";
import Docente from "../../models/teacherModel.js";
import Seccion from "../../models/sectionModel.js";
import Curso from "../../models/courseModel.js";
import { NotFoundError } from "../../shared/errors/httpErrors.js";
import { ErrorCodes } from "../../shared/errors/errorCodes.js";
import {
  getLastCoursesBySection,
  getCourseAverage,
  totalReviewsForCourse,
  getStatsByCourse,
} from "../course/courseService.js";

export async function getAllTeachers({ page = 1, limit = 10, search }) {
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { correo: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return Docente.findAndCountAll({
    where,
    order: [["id", "ASC"]],
    limit,
    offset,
  });
}

export async function getTeacherById(id) {
  const teacher = await Docente.findByPk(id);
  if (!teacher)
    throw new NotFoundError(
      ErrorCodes.TEACHER_NOT_FOUND.code,
      "Docente no encontrado",
    );

  return teacher;
}

export async function getSectionsStatsByTeacherId(id) {
  const teacher = await Docente.findByPk(id);
  if (!teacher)
    throw new NotFoundError(
      ErrorCodes.TEACHER_NOT_FOUND.code,
      "Docente no encontrado",
    );

  const sections = await Seccion.findAll({
    where: { docente: id },
    include: [{ association: "Materia" }],
  });

  const sectionsWithStats = [];

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
        return {
          curso,
          stats,
          promedioGeneral: average.result,
          totalReviewsForCurso,
        };
      }),
    );

    const totalReviews = courseStats.reduce(
      (acc, c) => acc + c.totalReviewsForCurso,
      0,
    );
    const totalAverage =
      totalReviews > 0
        ? courseStats.reduce(
            (acc, c) =>
              acc + parseFloat(c.promedioGeneral) * c.totalReviewsForCurso,
            0,
          ) / totalReviews
        : 0;

    sectionsWithStats.push({
      section,
      promedioGeneral: totalAverage,
      totalReviews,
    });
  }

  sectionsWithStats.sort((a, b) => b.promedioGeneral - a.promedioGeneral);
  return { teacher, secciones: sectionsWithStats };
}

export async function getCoursesByTeacherId(id, { page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;
  const teacher = await Docente.findByPk(id);
  if (!teacher)
    throw new NotFoundError(
      ErrorCodes.TEACHER_NOT_FOUND.code,
      "Docente no encontrado",
    );

  const sections = await Seccion.findAll({ where: { docente: id } });
  const sectionIds = sections.map((s) => s.id);

  if (sectionIds.length === 0) return { count: 0, rows: [] };

  return Curso.findAndCountAll({
    where: { seccion: { [Op.in]: sectionIds } },
    include: [{ association: "Seccion", include: [{ association: "Materia" }] }],
    order: [
      ["year", "DESC"],
      ["periodo", "DESC"],
    ],
    limit,
    offset,
  });
}
