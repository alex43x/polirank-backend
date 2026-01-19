import express from "express";
import {
  getAllCourses,
  getCourseById,
  getReviewsByCourse,
} from "../controllers/courseController.js";

const courseRoutes = express.Router();

  // Rutas para cursos
  courseRoutes.get("/", 
    /* #swagger.tags = ['Cursos']
      #swagger.summary = 'Obtener todos los cursos'
      #swagger.description = 'Obtener la lista de todos los cursos. Solo ADMIN puede ver todos los cursos.'
      #swagger.responses[200] = {
        description: "Lista de cursos obtenida exitosamente"
      }
    */
    getAllCourses
  );

  courseRoutes.get("/:id", 
    /* #swagger.tags = ['Cursos']
      #swagger.summary = 'Obtener curso por ID'
      #swagger.description = 'Obtener un curso específico por su ID. Solo ADMIN puede ver la información de cursos.'
      #swagger.parameters['id'] = {
        in: 'path',
        description: 'ID del curso',
        required: true,
        type: 'integer'
      }
      #swagger.responses[200] = {
        description: "Curso obtenido exitosamente"
      }
      #swagger.responses[404] = {
        description: "Curso no encontrado"
      }
    */
    getCourseById
  );

  // Rutas para reviews de cursos específicos
  courseRoutes.get("/:id/reviews", 
    /* #swagger.tags = ['Cursos']
      #swagger.summary = 'Obtener reviews de un curso'
      #swagger.description = 'Obtener todas las reviews de un curso específico. Solo ADMIN puede ver las reviews de cualquier curso.'
      #swagger.parameters['id'] = {
        in: 'path',
        description: 'ID del curso',
        required: true,
        type: 'integer'
      }
      #swagger.responses[200] = {
        description: "Reviews del curso obtenidas exitosamente"
      }
      #swagger.responses[404] = {
        description: "Curso no encontrado o sin reviews"
      }
    */
    getReviewsByCourse
  );


export default courseRoutes;
