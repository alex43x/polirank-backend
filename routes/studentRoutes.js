import express from "express";
import studentController from "../controllers/studentController.js";

const studentRoutes = express.Router();

studentRoutes.get("/", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Obtener todos los estudiantes'
     #swagger.description = 'Endpoint para obtener la lista de todos los estudiantes' */
  studentController.getAllStudents
);

studentRoutes.get("/:id", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Obtener estudiante por ID'
     #swagger.description = 'Endpoint para obtener un estudiante específico por su ID' */
  studentController.getStudentbyId
);

studentRoutes.get("/:id/reviews", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Obtener reviews de un estudiante'
     #swagger.description = 'Endpoint para obtener todas las reviews creadas por un estudiante' */
  studentController.getStudentReviews
);

studentRoutes.post("/", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Crear un nuevo estudiante'
     #swagger.description = 'Endpoint para crear un nuevo estudiante' */
  studentController.createStudent
);

studentRoutes.put("/:id", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Actualizar un estudiante'
     #swagger.description = 'Endpoint para actualizar la información de un estudiante existente' */
  studentController.updateStudent
);

studentRoutes.delete("/:id", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Eliminar un estudiante'
     #swagger.description = 'Endpoint para eliminar un estudiante existente' */
  studentController.deleteStudent
);

export default studentRoutes;