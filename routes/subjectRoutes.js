import express from "express";
import subjectController from "../controllers/subjectController.js";

const subjectRoutes = express.Router();

subjectRoutes.get("/", subjectController.getAllSubjects);
subjectRoutes.get("/:id", subjectController.getSubjectbyId);
subjectRoutes.get("/:id/secciones", subjectController.getSectionsStatsBySubjectId);

export default subjectRoutes;