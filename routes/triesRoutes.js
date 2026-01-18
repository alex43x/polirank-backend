import express from "express";
import triesController from "../controllers/triesController.js";

const triesRoutes = express.Router();

triesRoutes.get("/", 
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Obtener todos los intentos'
     #swagger.description = 'Endpoint para obtener la lista de todos los intentos' */
  triesController.getAllTries
);

triesRoutes.get("/:id", 
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Obtener intento por ID'
     #swagger.description = 'Endpoint para obtener un intento específico por su ID' */
  triesController.getTrybyId
);

triesRoutes.post("/", 
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Crear un nuevo intento'
     #swagger.description = 'Endpoint para crear un nuevo intento' */
  triesController.createTry
);

triesRoutes.put("/:id", 
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Actualizar un intento'
     #swagger.description = 'Endpoint para actualizar un intento existente' */
  triesController.updateTry
);

triesRoutes.delete("/:id", 
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Eliminar un intento'
     #swagger.description = 'Endpoint para eliminar un intento existente' */
  triesController.deleteTry
);

export default triesRoutes;