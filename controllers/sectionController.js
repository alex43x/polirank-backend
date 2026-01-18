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

    const stats = await getStatsByCourse(lastCurso.id);

    const average = await getCourseAverage(lastCurso.id);

    const response = {
      course: lastCurso,
      stats,
      promedioGeneral: average.result,
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

        const cursosStats = [];

        for (const curso of cursos.rows) {
            const stats = await getStatsByCourse(curso.id);
            const average = await getCourseAverage(curso.id);
            cursosStats.push({ curso, count: cursos.count, stats,  promedioGeneral: average.result });
        }
        return res.status(200).json(cursosStats);
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

export { getSectionLastStats, getSectionHistoryStats };
