import Curso from "../models/courseModel.js";
import Section from "../models/sectionModel.js";
import Materia from "../models/subjectModel.js";
import Docente from "../models/teacherModel.js";

// Helper para construir los includes comunes
const getCourseIncludes = () => {
  return [
    {
      model: Section,
      attributes: ["id"],
      include: [
        {
          model: Docente,
        },
        {
          model: Materia,
        },
      ],
    },
  ];
};

const getAllCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const courses = await Curso.findAndCountAll({
      include: getCourseIncludes(),
      order: [["id", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total: courses.count,
      totalPages: Math.ceil(courses.count / limit),
      currentPage: page,
      limit,
      cursos: courses.rows,
    });
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    res.status(500).json({ error: "Error al obtener los cursos" });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Curso.findByPk(id, {
      include: getCourseIncludes(),
    });

    if (!course) {
      return res.status(404).json({ error: "El curso no existe" });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    res.status(500).json({ error: "Error al obtener el curso" });
  }
};

const createCourse = async (req, res) => {
  try {
    const { seccion, year, periodo } = req.body;

    if (!seccion || !year || !periodo) {
      return res.status(400).json({
        error: "Se requieren los campos: seccion, year, periodo",
      });
    }

    // Validar que la sección existe
    const sectionExists = await Section.findByPk(seccion);
    if (!sectionExists) {
      return res.status(404).json({ error: "La sección no existe" });
    }

    // Validar curso duplicado
    const courseExistente = await Curso.findOne({
      where: { seccion, year, periodo },
    });
    if (courseExistente) {
      return res.status(400).json({
        error: "Ya existe un curso con esa sección, año y período",
      });
    }

    const course = await Curso.create({
      seccion,
      year,
      periodo,
    });

    const courseDetailed = await Curso.findByPk(course.id, {
      include: getCourseIncludes(),
    });

    return res.status(201).json({
      message: "Curso creado exitosamente",
      curso: courseDetailed,
    });
  } catch (error) {
    console.error("Error al crear el curso:", error);
    res.status(500).json({ error: "Error al crear el curso" });
  }
};

export {
  getAllCourses,
  getCourseById,
  createCourse,
};
