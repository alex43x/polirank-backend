import express from "express";
import triesController from "../controllers/triesController.js";
import roleMiddleware from "../middlewares/role.js";

const triesRoutes = express.Router();

triesRoutes.get("/",
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Obtener todos los intentos'
     #swagger.description = 'Obtener la lista de todos los intentos. Solo ADMIN puede ver todos los intentos.'
     #swagger.responses[200] = {
       description: "Lista de intentos obtenida exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos - Solo ADMIN"
     }
  */
  triesController.getAllTries
);

triesRoutes.get("/:id",
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Obtener intento por ID'
     #swagger.description = 'Obtener un intento específico por su ID. Solo ADMIN y STUDENT pueden ver sus propios intentos.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID del intento',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Intento obtenido exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos para ver este intento"
     }
     #swagger.responses[404] = {
       description: "Intento no encontrado"
     }
  */
  triesController.getTrybyId
);

triesRoutes.post("/",
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Crear un nuevo intento'
     #swagger.description = 'Crear un nuevo intento de materia. Solo ADMIN y STUDENT pueden crear intentos.'
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             required: ["asignatura", "valor"],
             properties: {
               asignatura: {
                 type: "integer",
                 example: 1,
                 description: "ID de la asignatura"
               },
               valor: {
                 type: "number",
                 example: 3,
                 description: "Número de intentos o valor del intento"
               }
             }
           }
         }
       }
     }
     #swagger.responses[201] = {
       description: "Intento creado exitosamente"
     }
     #swagger.responses[400] = {
       description: "Faltan campos requeridos"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[404] = {
       description: "Asignatura no encontrada"
     }
  */
  triesController.createTry
);

triesRoutes.put("/:id",
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Actualizar un intento'
     #swagger.description = 'Actualizar un intento existente. Solo ADMIN y STUDENT pueden actualizar sus propios intentos.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID del intento a actualizar',
       required: true,
       type: 'integer'
     }
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             properties: {
               asignatura: {
                 type: "integer",
                 example: 1,
                 description: "ID de la asignatura"
               },
               valor: {
                 type: "number",
                 example: 4,
                 description: "Número de intentos o valor del intento"
               }
             }
           }
         }
       }
     }
     #swagger.responses[200] = {
       description: "Intento actualizado exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos para actualizar este intento"
     }
     #swagger.responses[404] = {
       description: "Intento no encontrado"
     }
  */
  triesController.updateTry
);

triesRoutes.delete("/:id",
  /* #swagger.tags = ['Intentos']
     #swagger.summary = 'Eliminar un intento'
     #swagger.description = 'Eliminar un intento existente. Solo ADMIN y STUDENT pueden eliminar sus propios intentos.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID del intento a eliminar',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = { 
       description: "Intento eliminado"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos para eliminar este intento"
     }
     #swagger.responses[404] = {
       description: "Intento no encontrado"
     }
  */
  triesController.deleteTry
);

export default triesRoutes;