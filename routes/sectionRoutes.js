import express from "express";
import { getSectionLastStats, getSectionHistoryStats, getCoursesBySection} from "../controllers/sectionController.js";

const sectionRoutes = express.Router();

sectionRoutes.get("/:id/last", 
  /* #swagger.tags = ['Secciones']
     #swagger.summary = 'Obtener últimas estadísticas de sección'
     #swagger.description = 'Obtener las estadísticas más recientes de una sección (último curso). Solo ADMIN y STUDENT pueden ver las estadísticas de secciones.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID de la sección',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Estadísticas obtenidas exitosamente"
     }
     #swagger.responses[404] = {
       description: "Sección no encontrada"
     }
  */
  getSectionLastStats
);

sectionRoutes.get("/:id/history", 
  /* #swagger.tags = ['Secciones']
     #swagger.summary = 'Obtener historial de estadísticas de sección'
     #swagger.description = 'Obtener el historial completo de estadísticas de una sección. Solo ADMIN y STUDENT pueden ver el historial de estadísticas de secciones.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID de la sección',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Historial de estadísticas obtenido exitosamente"
     }
     #swagger.responses[404] = {
       description: "Sección no encontrada"
     }
  */
  getSectionHistoryStats
);

sectionRoutes.get("/:id/cursos",
  /* #swagger.tags = ['Secciones']
    #swagger.summary = 'Obtener cursos de sección'
    #swagger.description = 'Obtener todos los cursos pertenecientes a una sección específica ordenados por año y periodo. Solo ADMIN y STUDENT pueden ver los cursos de una sección.'
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'ID de la sección',
      required: true,
      type: 'integer'
    }
    #swagger.responses[200] = {
      description: "Cursos obtenidos exitosamente"
    }
    #swagger.responses[404] = {
      description: "Sección no encontrada"
    }
  */
  getCoursesBySection
);

export default sectionRoutes;