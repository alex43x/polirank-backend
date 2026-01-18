import { Router } from "express";
import authController from "../controllers/authController.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();

router.post("/login", 
  /* #swagger.tags = ['Auth']
     #swagger.summary = 'Iniciar sesión'
     #swagger.description = 'Endpoint para autenticar un usuario y obtener un token' */
  authController.login
);

router.get("/profile", authMiddleware, 
  /* #swagger.tags = ['Auth']
     #swagger.summary = 'Obtener perfil de usuario'
     #swagger.description = 'Endpoint para obtener el perfil del usuario autenticado'
     #swagger.security = [{ "bearerAuth": [] }] */
  authController.getUserProfile
);

export default router;
