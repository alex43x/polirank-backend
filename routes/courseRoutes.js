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
      #swagger.description = 'Endpoint para obtener la lista de todos los cursos' */
    getAllCourses
  );

  courseRoutes.get("/:id", 
    /* #swagger.tags = ['Cursos']
      #swagger.summary = 'Obtener curso por ID'
      #swagger.description = 'Endpoint para obtener un curso específico por su ID' */
    getCourseById
  );

  // Rutas para reviews de cursos específicos
  courseRoutes.get("/:id/reviews", 
    /* #swagger.tags = ['Cursos']
      #swagger.summary = 'Obtener reviews de un curso'
      #swagger.description = 'Endpoint para obtener todas las reviews de un curso específico' */
    getReviewsByCourse
  );


export default courseRoutes;
