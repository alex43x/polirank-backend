import ReviewCab from "../models/reviewCab.js";
import ReviewCont from "../models/reviewCont.js";
import Curso from "../models/courseModel.js";
import Student from "../models/studentModel.js";
import Aspecto from "../models/aspectModel.js";
import Section from "../models/sectionModel.js";
import Teacher from "../models/teacherModel.js";
import Subject from "../models/subjectModel.js";

// Helper para construir los includes comunes
const getReviewIncludes = (filters = {}) => {
  const { docente, materia } = filters;

  return [
    {
      model: ReviewCont,
      include: [
        {
          model: Aspecto,
        },
      ],
    },
    {
      model: Curso,
      include: [
        {
          model: Section,
          attributes: ["id"],
          include: [
            {
              model: Teacher,
              ...(docente && { where: { id: docente } }),
            },
            {
              model: Subject,
              ...(materia && { where: { id: materia } }),
            },
          ],
        },
      ],
    },
    {
      model: Student,
      attributes: ["id", "nombre", "correo"],
    },
  ];
};

// Obtener todas las reviews de un curso
const getReviewsByCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validar que el curso existe
    const courseExists = await Curso.findByPk(id);
    if (!courseExists) {
      return res.status(404).json({ error: "El curso no existe" });
    }

    const reviews = await ReviewCab.findAndCountAll({
      where: { curso: id },
      include: getReviewIncludes(),
      order: [["fecha", "DESC"]],
      limit,
      offset,
      distinct: true,
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
};

// Obtener reviews con filtros flexibles 
const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { docente, curso, materia, alumno } = req.query;

    const whereConditions = {};
    if (curso) whereConditions.curso = curso;
    if (alumno) whereConditions.alumno = alumno;

    const reviews = await ReviewCab.findAndCountAll({
      where: whereConditions,
      include: getReviewIncludes({ docente, materia }),
      order: [["fecha", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total: reviews.count,
      totalPages: Math.ceil(reviews.count / limit),
      currentPage: page,
      limit,
      reviews: reviews.rows,
    });
  } catch (error) {
    console.error("Error al obtener los reviews:", error);
    res.status(500).json({ error: "Error al obtener los reviews" });
  }
};

// Crear review para un curso específico
const createReviewForCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { aspectos } = req.body;
    const alumno = req.user.id;

    if (!["ADMIN", "STUDENT"].includes(req.user.rol.nombre)) {
      return res.status(403).json({ error: "No tienes permiso para crear un review" });
    }

    if (!aspectos || !Array.isArray(aspectos) || aspectos.length === 0) {
      return res.status(400).json({
        error: "Se requiere al menos un aspecto con su valor",
      });
    }

    // Validar curso existe
    const courseExists = await Curso.findByPk(id);
    if (!courseExists) {
      return res.status(404).json({ error: "El curso no existe" });
    }

    // Validar review duplicado
    const reviewExistente = await ReviewCab.findOne({
      where: { curso: id, alumno },
    });
    if (reviewExistente) {
      return res.status(400).json({
        error: "Ya existe una review de este alumno para este curso",
      });
    }

    // Validar aspectos
    for (const aspecto of aspectos) {
      if (!aspecto.aspecto || aspecto.valor === undefined) {
        return res.status(400).json({
          error: "Cada aspecto debe tener id y valor",
        });
      }

      if (aspecto.valor < 1 || aspecto.valor > 5) {
        return res.status(400).json({
          error: "El valor de cada aspecto debe estar entre 1 y 5",
        });
      }

      const aspectoExists = await Aspecto.findByPk(aspecto.aspecto);
      if (!aspectoExists) {
        return res.status(404).json({
          error: `El aspecto con id ${aspecto.aspecto} no existe`,
        });
      }
    }

    // Crear review
    const reviewCab = await ReviewCab.create({ curso: id, alumno });

    // Crear detalles
    const reviewDetails = await Promise.all(
      aspectos.map((aspecto) =>
        ReviewCont.create({
          revcab: reviewCab.id,
          aspecto: aspecto.aspecto,
          valor: aspecto.valor,
        })
      )
    );

    return res.status(201).json({
      message: "Review creado exitosamente",
      review: {
        id: reviewCab.id,
        curso: reviewCab.curso,
        alumno: reviewCab.alumno,
        fecha: reviewCab.fecha,
        detalles: reviewDetails,
      },
    });
  } catch (error) {
    console.error("Error al crear el review:", error);
    res.status(500).json({ error: "Error al crear el review" });
  }
};

// Crear review (mantenido para compatibilidad)
const createReview = async (req, res) => {
  try {
    const { curso, aspectos } = req.body;
    const alumno = req.user.id;

    if (!["ADMIN", "STUDENT"].includes(req.user.rol.nombre)) {
      return res.status(403).json({ error: "No tienes permiso para crear un review" });
    }

    if (!curso || !aspectos || !Array.isArray(aspectos) || aspectos.length === 0) {
      return res.status(400).json({
        error: "Se requiere curso y al menos un aspecto con su valor",
      });
    }

    // Validar curso existe
    const courseExists = await Course.findByPk(curso);
    if (!courseExists) {
      return res.status(404).json({ error: "El curso no existe" });
    }

    // Validar review duplicado
    const reviewExistente = await ReviewCab.findOne({
      where: { curso, alumno },
    });
    if (reviewExistente) {
      return res.status(400).json({
        error: "Ya existe una review de este alumno para este curso",
      });
    }

    // Validar aspectos
    for (const aspecto of aspectos) {
      if (!aspecto.aspecto || aspecto.valor === undefined) {
        return res.status(400).json({
          error: "Cada aspecto debe tener id y valor",
        });
      }

      if (aspecto.valor < 1 || aspecto.valor > 5) {
        return res.status(400).json({
          error: "El valor de cada aspecto debe estar entre 1 y 5",
        });
      }

      const aspectoExists = await Aspecto.findByPk(aspecto.aspecto);
      if (!aspectoExists) {
        return res.status(404).json({
          error: `El aspecto con id ${aspecto.aspecto} no existe`,
        });
      }
    }

    // Crear review
    const reviewCab = await ReviewCab.create({ curso, alumno });

    // Crear detalles
    const reviewDetails = await Promise.all(
      aspectos.map((aspecto) =>
        ReviewCont.create({
          revcab: reviewCab.id,
          aspecto: aspecto.aspecto,
          valor: aspecto.valor,
        })
      )
    );

    return res.status(201).json({
      message: "Review creado exitosamente",
      review: {
        id: reviewCab.id,
        curso: reviewCab.curso,
        alumno: reviewCab.alumno,
        fecha: reviewCab.fecha,
        detalles: reviewDetails,
      },
    });
  } catch (error) {
    console.error("Error al crear el review:", error);
    res.status(500).json({ error: "Error al crear el review" });
  }
};

// Obtener una review específica de un curso
const getReviewOfCourse = async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    // Validar que el curso existe
    const courseExists = await Curso.findByPk(id);
    if (!courseExists) {
      return res.status(404).json({ error: "El curso no existe" });
    }

    const review = await ReviewCab.findByPk(reviewId, {
      include: getReviewIncludes(),
    });

    if (!review) {
      return res.status(404).json({ error: "Review no encontrado" });
    }

    // Verificar que la review pertenece al curso
    if (review.curso !== parseInt(id)) {
      return res.status(404).json({ error: "La review no pertenece a este curso" });
    }

    return res.status(200).json(review);
  } catch (error) {
    console.error("Error al obtener el review:", error);
    res.status(500).json({ error: "Error al obtener el review" });
  }
};

// Obtener review por ID (mantenido para compatibilidad)
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await ReviewCab.findByPk(id, {
      include: getReviewIncludes(),
    });

    if (!review) {
      return res.status(404).json({ error: "Review no encontrado" });
    }

    return res.status(200).json(review);
  } catch (error) {
    console.error("Error al obtener el review:", error);
    res.status(500).json({ error: "Error al obtener el review" });
  }
};

// Actualizar review de un curso específico
const updateReviewOfCourse = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { aspectos } = req.body;
    const usuarioId = req.user.id;

    // Validar que el curso existe
    const courseExists = await Course.findByPk(id);
    if (!courseExists) {
      return res.status(404).json({ error: "El curso no existe" });
    }

    const review = await ReviewCab.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review no encontrado" });
    }

    // Verificar que la review pertenece al curso
    if (review.curso !== parseInt(id)) {
      return res.status(404).json({ error: "La review no pertenece a este curso" });
    }

    if (review.alumno !== usuarioId) {
      return res.status(403).json({
        error: "No tienes permiso para actualizar este review",
      });
    }

    if (aspectos) {
      if (!Array.isArray(aspectos) || aspectos.length === 0) {
        return res.status(400).json({
          error: "Debe proporcionar al menos un aspecto",
        });
      }

      // Validar aspectos
      for (const aspecto of aspectos) {
        if (!aspecto.aspecto || aspecto.valor === undefined) {
          return res.status(400).json({
            error: "Cada aspecto debe tener id y valor",
          });
        }

        if (aspecto.valor < 1 || aspecto.valor > 5) {
          return res.status(400).json({
            error: "El valor de cada aspecto debe estar entre 1 y 5",
          });
        }

        const aspectoExists = await Aspecto.findByPk(aspecto.aspecto);
        if (!aspectoExists) {
          return res.status(404).json({
            error: `El aspecto con id ${aspecto.aspecto} no existe`,
          });
        }
      }

      // Eliminar y recrear detalles
      await ReviewCont.destroy({ where: { revcab: reviewId } });

      await Promise.all(
        aspectos.map((aspecto) =>
          ReviewCont.create({
            revcab: reviewId,
            aspecto: aspecto.aspecto,
            valor: aspecto.valor,
          })
        )
      );
    }

    const reviewActualizado = await ReviewCab.findByPk(reviewId, {
      include: getReviewIncludes(),
    });

    return res.status(200).json({
      message: "Review actualizado exitosamente",
      review: reviewActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el review:", error);
    res.status(500).json({ error: "Error al actualizar el review" });
  }
};

// Actualizar review (mantenido para compatibilidad)
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { aspectos } = req.body;
    const usuarioId = req.user.id;

    const review = await ReviewCab.findByPk(id);

    if (!review) {
      return res.status(404).json({ error: "Review no encontrado" });
    }

    if (review.alumno !== usuarioId) {
      return res.status(403).json({
        error: "No tienes permiso para actualizar este review",
      });
    }

    if (aspectos) {
      if (!Array.isArray(aspectos) || aspectos.length === 0) {
        return res.status(400).json({
          error: "Debe proporcionar al menos un aspecto",
        });
      }

      // Validar aspectos (misma lógica que createReview)
      for (const aspecto of aspectos) {
        if (!aspecto.aspecto || aspecto.valor === undefined) {
          return res.status(400).json({
            error: "Cada aspecto debe tener id y valor",
          });
        }

        if (aspecto.valor < 1 || aspecto.valor > 5) {
          return res.status(400).json({
            error: "El valor de cada aspecto debe estar entre 1 y 5",
          });
        }

        const aspectoExists = await Aspecto.findByPk(aspecto.aspecto);
        if (!aspectoExists) {
          return res.status(404).json({
            error: `El aspecto con id ${aspecto.aspecto} no existe`,
          });
        }
      }

      // Eliminar y recrear detalles
      await ReviewCont.destroy({ where: { revcab: id } });

      await Promise.all(
        aspectos.map((aspecto) =>
          ReviewCont.create({
            revcab: id,
            aspecto: aspecto.aspecto,
            valor: aspecto.valor,
          })
        )
      );
    }

    const reviewActualizado = await ReviewCab.findByPk(id, {
      include: getReviewIncludes(),
    });

    return res.status(200).json({
      message: "Review actualizado exitosamente",
      review: reviewActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el review:", error);
    res.status(500).json({ error: "Error al actualizar el review" });
  }
};

// Eliminar review de un curso específico
const deleteReviewOfCourse = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const usuarioId = req.user.id;
    const usuarioRol = req.user.rol.nombre;

    // Validar que el curso existe
    const courseExists = await Curso.findByPk(id);
    if (!courseExists) {
      return res.status(404).json({ error: "El curso no existe" });
    }

    const review = await ReviewCab.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review no encontrado" });
    }

    // Verificar que la review pertenece al curso
    if (review.curso !== parseInt(id)) {
      return res.status(404).json({ error: "La review no pertenece a este curso" });
    }

    if (review.alumno !== usuarioId && usuarioRol !== "ADMIN") {
      return res.status(403).json({
        error: "No tienes permiso para eliminar este review",
      });
    }

    await ReviewCont.destroy({ where: { revcab: reviewId } });
    await ReviewCab.destroy({ where: { id: reviewId } });

    return res.status(200).json({
      message: "Review eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar el review:", error);
    res.status(500).json({ error: "Error al eliminar el review" });
  }
};

// Eliminar review (mantenido para compatibilidad)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const usuarioRol = req.user.rol.nombre;

    const review = await ReviewCab.findByPk(id);

    if (!review) {
      return res.status(404).json({ error: "Review no encontrado" });
    }

    if (review.alumno !== usuarioId && usuarioRol !== "ADMIN") {
      return res.status(403).json({
        error: "No tienes permiso para eliminar este review",
      });
    }

    await ReviewCont.destroy({ where: { revcab: id } });
    await ReviewCab.destroy({ where: { id } });

    return res.status(200).json({
      message: "Review eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar el review:", error);
    res.status(500).json({ error: "Error al eliminar el review" });
  }
};


// Obtiene promedio de los reviews registrados en el ultimo año y ultimo periodo en el curso seleccionado de un profesor en una materia 
const lastReviewStats = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.query;

    // Validar que el profesor existe
    const teacherExists = await Teacher.findByPk(teacherId);
    if (!teacherExists) {
      return res.status(404).json({ error: "El profesor no existe" });
    }

    // Validar que la materia existe
    const subjectExists = await Subject.findByPk(subjectId);
    if (!subjectExists) {
      return res.status(404).json({ error: "La materia no existe" });
    }

    // Validar que la sección existe
    const sectionExists = await Section.findOne({
      where: {
        docente: teacherId,
        asignatura: subjectId
      }
    });

    if (!sectionExists) {
      return res.status(404).json({ error: "La seccion para el profesor y materia no existe" });
    }

    // Obtener el último período y año del profesor en la materia
    const lastPeriodCourse = await Curso.findOne({
      include: [
        {
          model: Section,
          where: { docente: teacherId, asignatura: subjectId },
        },
      ],
      order: [["year", "DESC"], ["periodo", "DESC"]],
    });
    
    if (!lastPeriodCourse) {
      return res.status(404).json({ error: "No se encontraron cursos para este profesor" });
    }

    const lastPeriod = lastPeriodCourse.periodo;
    const lastYear = lastPeriodCourse.year;
    
    const lastRecords = await ReviewCab.findAll({
      include: [
        {
          model: Curso,
          include: [
            {
              model: Section,
              where: { docente: teacherId, asignatura: subjectId },
            },
          ],
        },
        {
          model: ReviewCont,
          include: [Aspecto],
        },
      ],
      where: {        
        '$Curso.periodo$': lastPeriod,
        '$Curso.year$': lastYear
      }
    });
    
    // Sumatoria de todos los valores de los aspectos
    const aspectoSums = {};
    const aspectoCounts = {};
    
    lastRecords.forEach((review) => {
      review.ReviewConts.forEach((detail) => {
        const aspectoName = detail.Aspecto.nombre;
        if (!aspectoSums[aspectoName]) {
          aspectoSums[aspectoName] = 0;
          aspectoCounts[aspectoName] = 0;
        }
        aspectoSums[aspectoName] += detail.valor;
        aspectoCounts[aspectoName] += 1;
      });
    });

    // Calcular promedios
    const averageRatings = {};
    for (const aspecto in aspectoSums) {
      averageRatings[aspecto] = aspectoSums[aspecto] / aspectoCounts[aspecto];
    }

    return res.status(200).json({
      teacherId,
      totalReviews: lastRecords.length,
      averageRatings,
    });


  } catch (error) {
    console.error("Error al obtener los ultimos reviews:", error);
    res.status(500).json({ error: "Error al obtener los ultimos reviews" });
  }
};

// Obtener historial de estadísticas por período y año
const getReviewStats = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.query;
    
    // Validar que el profesor existe
    const teacherExists = await Teacher.findByPk(teacherId);
    if (!teacherExists) {
      return res.status(404).json({ error: "El profesor no existe" });
    }

    // Validar que la materia existe
    const subjectExists = await Subject.findByPk(subjectId);
    if (!subjectExists) {
      return res.status(404).json({ error: "La materia no existe" });
    }

    const sectionExists = await Section.findOne({
      where: {
        docente: teacherId,
        asignatura: subjectId
      }
    });

    if (!sectionExists) {
      return res.status(404).json({ error: "La seccion para el profesor y materia no existe" });
    }

    // Obtener todos los reviews con sus cursos
    const stats = await ReviewCab.findAll({
      include: [
        {
          model: Curso,
          include: [
            {
              model: Section,
              where: { docente: teacherId, asignatura: subjectId },
            },
          ],
        },
        {
          model: ReviewCont,
          include: [
            {
              model: Aspecto,
            }
          ],
        },
      ],
    });

    // Agrupar por período y año
    const historyByPeriod = {};

    stats.forEach((review) => {
      const periodo = review.Curso.periodo;
      const year = review.Curso.year;
      const key = `${year}-${periodo}`; // Ejemplo: "2024-1" o "2023-2"

      if (!historyByPeriod[key]) {
        historyByPeriod[key] = {
          periodo,
          year,
          totalReviews: 0,
          aspectoSums: {},
          aspectoCounts: {}
        };
      }

      historyByPeriod[key].totalReviews += 1;

      // Procesar cada aspecto del review
      review.ReviewConts.forEach((detail) => {
        const aspectoName = detail.Aspecto.nombre;
        
        if (!historyByPeriod[key].aspectoSums[aspectoName]) {
          historyByPeriod[key].aspectoSums[aspectoName] = 0;
          historyByPeriod[key].aspectoCounts[aspectoName] = 0;
        }
        
        historyByPeriod[key].aspectoSums[aspectoName] += detail.valor;
        historyByPeriod[key].aspectoCounts[aspectoName] += 1;
      });
    });

    // Calcular promedios y formatear resultado
    const history = Object.keys(historyByPeriod).map(key => {
      const period = historyByPeriod[key];
      const averageRatings = {};

      for (const aspecto in period.aspectoSums) {
        averageRatings[aspecto] = period.aspectoSums[aspecto] / period.aspectoCounts[aspecto];
      }

      return {
        periodo: period.periodo,
        year: period.year,
        totalReviews: period.totalReviews,
        averageRatings
      };
    });

    // Ordenar por año y período (más reciente primero)
    history.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.periodo - a.periodo;
    });

    return res.status(200).json({
      teacherId,
      subjectId,
      history
    });

  } catch (error) {
    console.error("Error al obtener las estadísticas de reviews:", error);
    res.status(500).json({ error: "Error al obtener las estadísticas de reviews" });
  }
}


export {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsByCourse,
  createReviewForCourse,
  getReviewOfCourse,
  updateReviewOfCourse,
  deleteReviewOfCourse,
  lastReviewStats,
  getReviewStats
};