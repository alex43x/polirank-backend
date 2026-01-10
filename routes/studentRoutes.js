import express from "express";
import studentController from "../controllers/studentController.js";

const studentRoutes = express.Router();

studentRoutes.get("/", studentController.getAllStudents);
studentRoutes.get("/:id", studentController.getStudentbyId);
studentRoutes.post("/", studentController.createStudent);
studentRoutes.put("/:id", studentController.updateStudent);
studentRoutes.delete("/:id", studentController.deleteStudent);

export default studentRoutes;