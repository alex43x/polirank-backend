import express from "express";
import { getSectionLastStats, getSectionHistoryStats} from "../controllers/sectionController.js";

const sectionRoutes = express.Router();

sectionRoutes.get("/:id/last", getSectionLastStats);
sectionRoutes.get("/:id/history", getSectionHistoryStats);

export default sectionRoutes;