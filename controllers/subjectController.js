import Subject from "../models/subjectModel.js";
import Section from "../models/sectionModel.js";
import Malla from "../models/curriculumModel.js";
import Docente from "../models/teacherModel.js";
import Departamento from "../models/departmentModel.js";
import Curso from "../models/courseModel.js";
import Intento from "../models/triesModel.js";
import { Op } from "sequelize";
import {
  getLastCourseBySection,
  getCourseAverage,
  totalReviewsForCourse,
  getLastCoursesBySection,
  getStatsByCourse,
} from "../services/courseService.js";
import { calculateSubjectTriesStats } from "../services/subjectService.js";
// Helper para obtener IDs de asignaturas basado en mallas curriculares
const getSubjectIdsByCurriculum = async (careerId = null, semester = null) => {
  const whereConditions = {};

  // Si careerId existe → filtramos por carrera
  if (careerId !== null) {
    whereConditions.carrera = careerId;
  }

  // Si se pasó semestre → filtramos por semestre
  if (semester !== null) {
    whereConditions.semestre = semester;
  }

  const mallas = await Malla.findAndCountAll({
    where: whereConditions,
  });

  if (mallas.count === 0) {
    return null;
  }

  const subjectIds = mallas.rows.map((malla) => malla.asignatura);
  return subjectIds;
};

const getAllSubjects = async (req, res) => {
  try {
    const currentUser = req.user;

    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Parámetros de búsqueda y filtrado
    const search = req.query.search || "";
    const dpto_id = req.query.dpto_id;
    const career_id = req.query.career_id || null;
    const semester = req.query.semester || null;

    // Construir condiciones de búsqueda
    const whereConditions = {};

    // Búsqueda por nombre
    if (search) {
      whereConditions[Op.or] = [{ nombre: { [Op.iLike]: `%${search}%` } }];
    }

    // Aplicar filtros por segun el rol del usuario
    switch (currentUser.rol.nombre) {
      case "ADMIN":
        // ADMIN puede ver todas las materias
        if (career_id || semester) {
          const subjectIds = await getSubjectIdsByCurriculum(career_id, semester);

          if (!subjectIds) {
            return res.json("No subjects available for this user");
          }

          whereConditions.id = { [Op.in]: subjectIds };
        }

        break;

      case "STUDENT":
        // STUDENT solo puede ver las materias de su carrera (desde header X-Carrera-Id)
        if (!req.carreraId) {
          return res.status(400).json({ error: "Se requiere X-Carrera-Id header" });
        }
        const subjectIds = await getSubjectIdsByCurriculum(
          req.carreraId,
          semester
        );

        if (!subjectIds) {
          return res.json("No subjects available for this user");
        }

        whereConditions.id = { [Op.in]: subjectIds };
        break;

      default:
        // Otros roles no tienen acceso
        return {
          statusCode: HttpStatus.OK,
          message: "No subjects available for this user",
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        };
    }

    // Tanto el Admin como el Student pueden aplicar filtro por departamento
    if (dpto_id) {
      whereConditions.depto = dpto_id;
    }

    const subjects = await Subject.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Departamento,
        },
      ],
      order: [["id", "ASC"]],
      limit,
      offset,
    });

    return res.json({
      total: subjects.count,
      totalPages: Math.ceil(subjects.count / limit),
      currentPage: page,
      limit,
      subjects: subjects.rows,
    });
  } catch (error) {
    console.error("Error al obtener las materias:", error);
    res.status(500).send("Error al obtener las materias");
  }
};

const getSubjectbyId = async (req, res) => {
  const { id } = req.params;

  try {
    const currentUser = req.user;

    if (currentUser.rol.nombre === "STUDENT") {
      // Verificar que la materia pertenezca a la carrera del estudiante
      if (!req.carreraId) {
        return res.status(400).json({ error: "Se requiere X-Carrera-Id header" });
      }
      const subjectIds = await getSubjectIdsByCurriculum(req.carreraId);

      if (!subjectIds || !subjectIds.includes(parseInt(id))) {
        return res.status(403).json({
          error: "No tienes permisos para ver esta materia" 
        });
      }
    } else if (currentUser.rol.nombre !== "ADMIN") {
      return res.status(403).json({
        error: "No tienes permisos para ver materias" 
      });
    }

    const subject = await Subject.findByPk(id, {
      include: [
        {
          model: Departamento,
        },
      ],
    });

    if (!subject) {
      return res.status(404).json({ error: "Materia no encontrada" });
    }

    return res.status(200).json(subject);
  } catch (error) {
    console.error("Error al obtener la materia:", error);
    res.status(500).send("Error al obtener la materia");
  }
};

const getSectionsBySubjectId = async (req, res) => {
  const { id } = req.params;

  try {
    const currentUser = req.user;

    if (currentUser.rol.nombre === "STUDENT") {
      if (!req.carreraId) {
        return res.status(400).json({ error: "Se requiere X-Carrera-Id header" });
      }
      const subjectIds = await getSubjectIdsByCurriculum(req.carreraId);

      if (!subjectIds || !subjectIds.includes(parseInt(id))) {
        return res.status(403).json({
          error: "No tienes permisos para ver las secciones de esta materia" 
        });
      }
    } else if (currentUser.rol.nombre !== "ADMIN") {
      return res.status(403).json({
        error: "No tienes permisos para ver secciones" 
      });
    }

    const sections = await Section.findAll({
      where: { asignatura: id },
      include: [
        {
          model: Docente,
        },
      ],
    });

    return res.status(200).json(sections);
  } catch (error) {
    console.error("Error al obtener las secciones:", error);
    res.status(500).send("Error al obtener las secciones");
  }
};

const getSectionsStatsBySubjectId = async (req, res) => {
  const { id } = req.params;

  try {
    const sections = await Section.findAll({
      where: { asignatura: id },
      include: [{ model: Docente }],
    });

    const sectionsWithAverage = [];

    for (const section of sections) {
      const lastCursos = await getLastCoursesBySection(section.id);
      if (!lastCursos || lastCursos.length === 0) continue;

      const courseStatsPromises = lastCursos.map(async (curso) => {
        const [stats, average, totalReviewsForCurso] = await Promise.all([
          getStatsByCourse(curso.id),
          getCourseAverage(curso.id),
          totalReviewsForCourse(curso.id),
        ]);
        return { curso, stats, promedioGeneral: average.result, totalReviewsForCurso };
      });

      const courseStats = await Promise.all(courseStatsPromises);

      const totalAverage = courseStats.reduce((acc, c) => acc + parseFloat(c.promedioGeneral), 0) / lastCursos.length;
      const totalReviews = courseStats.reduce((acc, c) => acc + c.totalReviewsForCurso, 0);

      sectionsWithAverage.push({
        section,
        promedioGeneral: totalAverage,
        totalReviews: totalReviews,
      });
    }

    sectionsWithAverage.sort((a, b) => b.promedioGeneral - a.promedioGeneral);
    return res.status(200).json(sectionsWithAverage);
  } catch (error) {
    console.error("Error al obtener las estadísticas de secciones:", error);
    res.status(500).send("Error al obtener las estadísticas de secciones");
  }
};


const getSubjectTriesStats = async (req, res) => {
  const { id } = req.params;

  try {
    const stats = await calculateSubjectTriesStats(id);
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error al obtener las estadísticas de intentos:", error);
    return res.status(500).send("Error al obtener las estadísticas de intentos");
  }
};

export default {
  getAllSubjects,
  getSubjectbyId,
  getSectionsBySubjectId,
  getSectionsStatsBySubjectId,
  getSubjectTriesStats,
};
