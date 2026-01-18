import express from "express";
import { getSectionLastStats, getSectionHistoryStats} from "../controllers/sectionController.js";

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

export default sectionRoutes;