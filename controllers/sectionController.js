import Section from "../models/sectionModel.js";
import {
  getLastCourseBySection,
  getCourseAverage,
  totalReviewsForCourse,
  getStatsByCourse,
  getLastCoursesBySection,
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

    const lastCursos = await getLastCoursesBySection(section.id);
    if (!lastCursos || lastCursos.length === 0) {
      return res
        .status(200)
        .json({ message: "No hay cursos disponibles para esta sección" });
    }

    const courseStatsPromises = lastCursos.map(async (curso) => {
      const [stats, average, totalReviewsForCurso] = await Promise.all([
        getStatsByCourse(curso.id),
        getCourseAverage(curso.id),
        totalReviewsForCourse(curso.id),
      ]);
      return { curso, stats, promedioGeneral: average.result, totalReviewsForCurso };
    });

    const courseStats = await Promise.all(courseStatsPromises);

    // Agrupar y promediar stats por aspecto
    const statsMap = {};
    courseStats.forEach((courseData) => {
      courseData.stats.rows.forEach((stat) => {
        const aspectId = stat.aspecto;
        if (!statsMap[aspectId]) {
          statsMap[aspectId] = {
            aspecto: aspectId,
            promedio: 0,
            count: 0,
            aspect: stat.Aspecto,
          };
        }
        statsMap[aspectId].promedio += parseFloat(stat.promedio);
        statsMap[aspectId].count += 1;
      });
    });

    // Calcular promedio final para cada aspecto
    const combinedStats = Object.values(statsMap).map((stat) => ({
      ...stat,
      promedio: (stat.promedio / stat.count).toFixed(2),
    }));

    const totalReviews = courseStats.reduce((acc, c) => acc + c.totalReviewsForCurso, 0);
    const totalAverage = totalReviews > 0 
      ? (courseStats.reduce((acc, c) => acc + (parseFloat(c.promedioGeneral) * c.totalReviewsForCurso), 0) / totalReviews)
      : 0;

    const response = {
      courses: lastCursos,
      stats: combinedStats,
      promedioGeneral: totalAverage,
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
