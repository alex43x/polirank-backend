import { Router } from "express";
import authController from "../controllers/authController.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();

router.post("/login", 
  /* #swagger.tags = ['Auth']
     #swagger.summary = 'Iniciar sesión'
     #swagger.description = 'Endpoint para autenticar un usuario y obtener un token'
     #swagger.security = [] 
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             required: ["correo", "password"],
             properties: {
               correo: {
                 type: "string",
                 format: "email",
                 example: "estudiante@example.com",
                 description: "Correo electrónico del usuario"
               },
               password: {
                 type: "string",
                 format: "password",
                 example: "password123",
                 description: "Contraseña del usuario"
               }
             }
           }
         }
       }
     }
     #swagger.responses[200] = {
       description: "Inicio de sesión exitoso",
       content: {
         "application/json": {
           schema: {
             type: "object",
             properties: {
               status: { type: "string", example: "success" },
               token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
               data: {
                 type: "object",
                 properties: {
                   student: {
                     type: "object",
                     properties: {
                       id: { type: "integer" },
                       nombre: { type: "string" },
                       correo: { type: "string" },
                       Rol: { type: "object" },
                       Carrera: { type: "object" }
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[401] = {
       description: "Credenciales inválidas"
     }
  */
  authController.login
);

router.get("/profile", authMiddleware, 
  /* #swagger.tags = ['Auth']
     #swagger.summary = 'Obtener perfil de usuario'
     #swagger.description = 'Obtener el perfil del usuario autenticado. Solo usuarios autenticados pueden ver su propio perfil.'
     #swagger.responses[200] = {
       description: "Perfil del usuario obtenido exitosamente",
       content: {
         "application/json": {
           schema: {
             type: "object",
             properties: {
               student: {
                 type: "object",
                 properties: {
                   id: { type: "integer" },
                   nombre: { type: "string" },
                   correo: { type: "string" },
                   Rol: { type: "object" },
                   Carrera: { type: "object" }
                 }
               },
               reviews: {
                 type: "object",
                 properties: {
                   count: { type: "integer" },
                   rows: { type: "array" }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[401] = {
       description: "Token inválido o no proporcionado"
     }
     #swagger.responses[404] = {
       description: "Usuario no encontrado"
     }
  */
  authController.getUserProfile
);

export default router;
