import Section from "../models/sectionModel.js";
import {
  getLastCourseBySection,
  getCourseAverage,
  totalReviewsForCourse,
  getStatsByCourse,
} from "../services/courseService.js";
import Stats from "../models/statsModel.js";
import Aspecto from "../models/aspectModel.js";
import Curso from "../models/courseModel.js";

const getSectionLastStats = async (req, res) => {
  const { id } = req.params;

  try {
    const section = await Section.findByPk(id);

    if (!section) {
      return res.status(404).json({ message: "Sección no encontrada" });
    }

    const lastCurso = await getLastCourseBySection(section.id);
    if (!lastCurso) {
      return res
        .status(200)
        .json({ message: "No hay cursos disponibles para esta sección" });
    }

    const [stats, average, totalReviews] = await Promise.all([
      getStatsByCourse(lastCurso.id),
      getCourseAverage(lastCurso.id),
      totalReviewsForCourse(lastCurso.id),
    ]);

    const response = {
      course: lastCurso,
      stats,
      promedioGeneral: average.result,
      totalReviews
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error al obtener las estadísticas de secciones:", error);
    res.status(500).send("Error al obtener las estadísticas de secciones");
  }
};

const getSectionHistoryStats = async (req, res) => {
  const { id } = req.params;


  try {
    const cursos = await Curso.findAndCountAll({
      where: { seccion: id },
    });



    const courseStatsPromises = cursos.rows.map(async (curso) => {
      const [stats, average, totalReviews] = await Promise.all([
        getStatsByCourse(curso.id),
        getCourseAverage(curso.id),
        totalReviewsForCourse(curso.id),
      ]);
      return { curso, stats, promedioGeneral: average.result, totalReviews };
    });

    const courseStats = await Promise.all(courseStatsPromises);

    const totalAverage = courseStats.reduce((acc, c) => acc + parseFloat(c.promedioGeneral), 0) / cursos.count;

    return res.status(200).json({ count: cursos.count, courseStats, totalPromedio: totalAverage });
  } catch (error) {
    console.error(
      "Error al obtener el historial de estadísticas de la sección:",
      error,
    );
    res
      .status(500)
      .send("Error al obtener el historial de estadísticas de la sección");
  }
};

const getCoursesBySection = async (req, res) => {
  const { id } = req.params;

  try {
    const courses = await Curso.findAndCountAll({
      where: { seccion: id },
      order: [
        ['year', 'DESC'],
        ['periodo', 'DESC']
      ]
    });

    return res.status(200).json({ cursos: courses.rows, count: courses.count });
  } catch (error) {
    console.error("Error al obtener los cursos de la sección:", error);
    res.status(500).send("Error al obtener los cursos de la sección");
  }
}

export { getSectionLastStats, getSectionHistoryStats, getCoursesBySection };
