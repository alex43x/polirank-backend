import express from "express";
import { getSectionLastStats, getSectionHistoryStats, getCoursesBySection} from "../controllers/sectionController.js";

const sectionRoutes = express.Router();

sectionRoutes.get("/:id/last", 
  /* #swagger.tags = ['Secciones']
     #swagger.summary = 'Obtener últimas estadísticas de sección'
     #swagger.description = 'Endpoint para obtener las estadísticas más recientes de una sección' */
  getSectionLastStats
);

sectionRoutes.get("/:id/history", 
  /* #swagger.tags = ['Secciones']
     #swagger.summary = 'Obtener historial de estadísticas de sección'
     #swagger.description = 'Endpoint para obtener el historial de estadísticas de una sección' */
  getSectionHistoryStats
);

sectionRoutes.get("/:id/cursos",
  /* #swagger.tags = ['Secciones']
    #swagger.summary = 'Obtener cursos de sección'
    #swagger.description = 'Endpoint para obtener todos los cursos pertenecientes a una sección específica' */
  getCoursesBySection
);

export default sectionRoutes;