import Curso from "../models/courseModel.js";
import Section from "../models/sectionModel.js";
import Materia from "../models/subjectModel.js";
import Docente from "../models/teacherModel.js";
import ReviewCab from "../models/reviewCab.js";
import ReviewCont from "../models/reviewCont.js";
import Alumno from "../models/studentModel.js";
import Aspecto from "../models/aspectModel.js";

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

const getReviewsByCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const course = await Curso.findByPk(id);

    if (!course) {
      return res.status(404).json({ error: "El curso no existe" });
    }

    const reviews = await ReviewCab.findAndCountAll({
        where: { curso: id },
        include: [
            {
                model: ReviewCont,
                include: [
                    {
                        model: Aspecto,
                    },
                ],
            },
            {
                model: Alumno,
            },
        ],
        limit,
        offset,
    });

    return res.status(200).json({
      total: reviews.count,
      totalPages: Math.ceil(reviews.count / limit),
      currentPage: page,
      limit,
      reviews: reviews.rows,
    });
  } catch (error) {
    console.error("Error al obtener las reviews del curso:", error);
    res.status(500).json({ error: "Error al obtener las reviews del curso" });
  }
}

export {
  getAllCourses,
  getCourseById,
  getReviewsByCourse,
};
