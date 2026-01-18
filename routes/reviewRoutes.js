import express from "express";
import { getAllReviews, getReviewById, createReview, updateReview, deleteReview} from "../controllers/reviewController.js";

const reviewRoutes = express.Router();

reviewRoutes.get("/", 
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Obtener todas las reviews'
     #swagger.description = 'Endpoint para obtener la lista de todas las reviews' */
  getAllReviews
);

reviewRoutes.get("/:id", 
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Obtener review por ID'
     #swagger.description = 'Endpoint para obtener una review específica por su ID' */
  getReviewById
);

reviewRoutes.post("/", 
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Crear una nueva review'
     #swagger.description = 'Endpoint para crear una nueva review' */
  createReview
);

reviewRoutes.put("/:id", 
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Actualizar una review'
     #swagger.description = 'Endpoint para actualizar una review existente' */
  updateReview
);

reviewRoutes.delete("/:id", 
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Eliminar una review'
     #swagger.description = 'Endpoint para eliminar una review existente' */
  deleteReview
);

export default reviewRoutes;