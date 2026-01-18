import express from "express";
import { getAllReviews, getReviewById, createReview, updateReview, deleteReview} from "../controllers/reviewController.js";

const reviewRoutes = express.Router();

reviewRoutes.get("/", getAllReviews);
reviewRoutes.get("/:id", getReviewById);
reviewRoutes.post("/", createReview);
reviewRoutes.put("/:id", updateReview);
reviewRoutes.delete("/:id", deleteReview);

export default reviewRoutes;