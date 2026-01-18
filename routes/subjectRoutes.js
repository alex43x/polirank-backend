import express from "express";
import subjectController from "../controllers/subjectController.js";

const subjectRoutes = express.Router();

subjectRoutes.get("/", 
  /* #swagger.tags = ['Materias']
     #swagger.summary = 'Obtener todas las materias'
     #swagger.description = 'Endpoint para obtener la lista de todas las materias' */
  subjectController.getAllSubjects
);

subjectRoutes.get("/:id", 
  /* #swagger.tags = ['Materias']
     #swagger.summary = 'Obtener materia por ID'
     #swagger.description = 'Endpoint para obtener una materia específica por su ID' */
  subjectController.getSubjectbyId
);

subjectRoutes.get("/:id/secciones", 
  /* #swagger.tags = ['Materias']
     #swagger.summary = 'Obtener estadísticas de secciones de una materia'
     #swagger.description = 'Endpoint para obtener las estadísticas de las secciones de una materia específica' */
  subjectController.getSectionsStatsBySubjectId
);

export default subjectRoutes;