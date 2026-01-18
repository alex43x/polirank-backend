import express from "express";
import { getAllReviews, getReviewById, createReview, updateReview, deleteReview} from "../controllers/reviewController.js";

const reviewRoutes = express.Router();

reviewRoutes.get("/", 
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Obtener todas las reviews'
     #swagger.description = 'Obtener la lista de todas las reviews con filtros y paginación. Solo ADMIN puede ver todas las reviews.'
     #swagger.parameters['page'] = {
       in: 'query',
       description: 'Número de página (default: 1)',
       required: false,
       type: 'integer',
       example: 1
     }
     #swagger.parameters['limit'] = {
       in: 'query',
       description: 'Cantidad de resultados por página (default: 10)',
       required: false,
       type: 'integer',
       example: 10
     }
     #swagger.parameters['docente'] = {
       in: 'query',
       description: 'ID del docente para filtrar',
       required: false,
       type: 'integer'
     }
     #swagger.parameters['curso'] = {
       in: 'query',
       description: 'ID del curso para filtrar',
       required: false,
       type: 'integer'
     }
     #swagger.parameters['materia'] = {
       in: 'query',
       description: 'ID de la materia para filtrar',
       required: false,
       type: 'integer'
     }
     #swagger.parameters['alumno'] = {
       in: 'query',
       description: 'ID del alumno para filtrar',
       required: false,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Lista de reviews obtenida exitosamente"
     }
  */
  getAllReviews
);

reviewRoutes.get("/:id", 
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Obtener review por ID'
     #swagger.description = 'Obtener una review específica por su ID.Solo ADMIN puede ver cualquier review y STUDENT puede ver su propia review.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID de la review',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Review obtenida exitosamente"
     }
     #swagger.responses[404] = {
       description: "Review no encontrada"
     }
  */
  getReviewById
);

reviewRoutes.post("/",
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Crear una nueva review'
     #swagger.description = 'Crear una nueva review. Solo ADMIN y STUDENT pueden crear reviews.'
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             required: ["curso", "aspectos"],
             properties: {
               curso: {
                 type: "integer",
                 example: 1,
                 description: "ID del curso a evaluar"
               },
               aspectos: {
                 type: "array",
                 description: "Lista de aspectos a evaluar con sus valores",
                 items: {
                   type: "object",
                   required: ["aspecto", "valor"],
                   properties: {
                     aspecto: {
                       type: "integer",
                       example: 1,
                       description: "ID del aspecto"
                     },
                     valor: {
                       type: "integer",
                       minimum: 1,
                       maximum: 5,
                       example: 4,
                       description: "Valor de la evaluación (1-5)"
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[201] = {
       description: "Review creada exitosamente"
     }
     #swagger.responses[400] = {
       description: "Datos inválidos o review duplicada"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos para crear reviews"
     }
     #swagger.responses[404] = {
       description: "Curso o aspecto no encontrado"
     }
  */
  createReview
);

reviewRoutes.put("/:id",
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Actualizar una review'
     #swagger.description = 'Actualizar una review existente. Solo ADMIN y STUDENT pueden actualizar sus propias reviews.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID de la review a actualizar',
       required: true,
       type: 'integer'
     }
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             required: ["aspectos"],
             properties: {
               aspectos: {
                 type: "array",
                 description: "Lista de aspectos a actualizar con sus valores",
                 items: {
                   type: "object",
                   required: ["aspecto", "valor"],
                   properties: {
                     aspecto: {
                       type: "integer",
                       example: 1,
                       description: "ID del aspecto"
                     },
                     valor: {
                       type: "integer",
                       minimum: 1,
                       maximum: 5,
                       example: 5,
                       description: "Nuevo valor de la evaluación (1-5)"
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[200] = {
       description: "Review actualizada exitosamente"
     }
     #swagger.responses[400] = {
       description: "Datos inválidos"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos para actualizar esta review"
     }
     #swagger.responses[404] = {
       description: "Review no encontrada"
     }
  */
  updateReview
);

reviewRoutes.delete("/:id",
  /* #swagger.tags = ['Reviews']
     #swagger.summary = 'Eliminar una review'
     #swagger.description = 'Eliminar una review existente. Solo ADMIN y STUDENT pueden eliminar sus propias reviews.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID de la review a eliminar',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Review eliminada exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos para eliminar esta review"
     }
     #swagger.responses[404] = {
       description: "Review no encontrada"
     }
  */
  deleteReview
);

export default reviewRoutes;