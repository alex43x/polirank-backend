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
};