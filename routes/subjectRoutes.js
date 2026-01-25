import express from "express";
import subjectController from "../controllers/subjectController.js";

const subjectRoutes = express.Router();

subjectRoutes.get("/",
  /* #swagger.tags = ['Materias']
     #swagger.summary = 'Obtener todas las materias'
     #swagger.description = 'Obtener la lista de todas las materias con filtros según el rol. Solo ADMIN puede ver todas las materias y STUDENT solo puede ver las materias de su carrera.'
     #swagger.parameters['page'] = {
       in: 'query',
       description: 'Número de página (default: 1)',
       required: false,
       type: 'integer',
       example: 1
     }
     #swagger.parameters['limit'] = {
       in: 'query',
       description: 'Cantidad de resultados por página (default: 10)',
       required: false,
       type: 'integer',
       example: 10
     }
     #swagger.parameters['search'] = {
       in: 'query',
       description: 'Buscar por nombre de materia',
       required: false,
       type: 'string'
     }
     #swagger.parameters['dpto_id'] = {
       in: 'query',
       description: 'Filtrar por ID de departamento',
       required: false,
       type: 'integer'
     }
     #swagger.parameters['career_id'] = {
       in: 'query',
       description: 'Filtrar por ID de carrera (solo ADMIN)',
       required: false,
       type: 'integer'
     }
     #swagger.parameters['semester'] = {
       in: 'query',
       description: 'Filtrar por semestre',
       required: false,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Lista de materias obtenida exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
  */
  subjectController.getAllSubjects
);

subjectRoutes.get("/:id",
  /* #swagger.tags = ['Materias']
     #swagger.summary = 'Obtener materia por ID'
     #swagger.description = 'Obtener una materia específica por su ID. Solo ADMIN puede ver todas las materias y STUDENT solo puede ver las materias de su carrera.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID de la materia',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Materia obtenida exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos para ver esta materia"
     }
     #swagger.responses[404] = {
       description: "Materia no encontrada"
     }
  */
  subjectController.getSubjectbyId
);

subjectRoutes.get("/:id/secciones",
  /* #swagger.tags = ['Materias']
     #swagger.summary = 'Obtener estadísticas de secciones de una materia'
     #swagger.description = 'Obtener las estadísticas de todas las secciones de una materia específica. Solo ADMIN y STUDENT pueden ver las estadísticas de secciones.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID de la materia',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Estadísticas de secciones obtenidas exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos para ver esta materia"
     }
     #swagger.responses[404] = {
       description: "Materia no encontrada"
     }
  */
  subjectController.getSectionsStatsBySubjectId
);

subjectRoutes.get("/:id/intentos",
  /* #swagger.tags = ['Materias']
     #swagger.summary = 'Obtener estadísticas de intentos de una materia'
     #swagger.description = 'Obtener la distribución de estudiantes agrupados por número de intentos en una materia.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID de la materia',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Estadísticas de intentos obtenidas exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
  */
  subjectController.getSubjectTriesStats
);

export default subjectRoutes;