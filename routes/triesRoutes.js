import express from "express";
import triesController from "../controllers/triesController.js";

const triesRoutes = express.Router();

triesRoutes.get("/", triesController.getAllTries);
triesRoutes.get("/:id", triesController.getTrybyId);
triesRoutes.post("/", triesController.createTry);
triesRoutes.put("/:id", triesController.updateTry);
triesRoutes.delete("/:id", triesController.deleteTry);

export default triesRoutes;