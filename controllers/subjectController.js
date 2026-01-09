import Subject from "../models/subjectModel.js";
import Section from "../models/sectionModel.js";
import Malla from "../models/curriculumModel.js";
import Docente from "../models/teacherModel.js";
import { Op } from "sequelize";


// Helper para obtener IDs de asignaturas basado en mallas curriculares
const getSubjectIdsByCurriculum = async (careerId, semester = null) => {
  const mallas = await Malla.findAndCountAll({
    where: { carrera: careerId },
  });

  if (mallas.count === 0) {
    return null;
  }

  // Si se proporciona semestre, filtrar por semestre
  if (semester) {
    const semesterSubjectIds = mallas.rows
      .filter((malla) => malla.semestre === parseInt(semester))
      .map((malla) => malla.asignatura);
    
    return semesterSubjectIds;
  }

  // Si no hay filtro de semestre, devolver todos los IDs
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
        // ADMIN puede ver todas las materias, (puede aplicar filtro por carrera si se proporciona)
        if (career_id) {
          const subjectIds = await getSubjectIdsByCurriculum(career_id, semester);
          
          if (!subjectIds) {
            return res.json("No subjects available for this user");
          }
          
          whereConditions.id = { [Op.in]: subjectIds };
        }

        break;

      case "STUDENT":
        // STUDENT solo puede ver las materias de su carrera
        const subjectIds = await getSubjectIdsByCurriculum(
          currentUser.carrera.id, 
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
      whereConditions.dpto_id = dpto_id;
    }

    const subjects = await Subject.findAndCountAll({
      where: whereConditions,
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
    const subject = await Subject.findByPk(id);

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
    const sections = await await Section.findAll({
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

export default {
  getAllSubjects,
  getSubjectbyId,
  getSectionsBySubjectId,
};
