import express from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
} from "../controllers/courseController.js";
import {
  getReviewsByCourse,
  createReviewForCourse,
  getReviewOfCourse,
  updateReviewOfCourse,
  deleteReviewOfCourse,
  getReviewStats,
  lastReviewStats
} from "../controllers/reviewController.js";

const courseRoutes = express.Router();

// Rutas para cursos
courseRoutes.get("/", getAllCourses);
courseRoutes.get("/:id", getCourseById);
courseRoutes.post("/", createCourse);

// Rutas para reviews de cursos específicos
courseRoutes.get("/:id/reviews", getReviewsByCourse);
courseRoutes.post("/:id/reviews", createReviewForCourse);
courseRoutes.get("/:id/reviews/last", lastReviewStats);
courseRoutes.get("/:id/reviews/history", getReviewStats);
courseRoutes.get("/:id/reviews/:reviewId", getReviewOfCourse);
courseRoutes.put("/:id/reviews/:reviewId", updateReviewOfCourse);
courseRoutes.delete("/:id/reviews/:reviewId", deleteReviewOfCourse);


export default courseRoutes;
