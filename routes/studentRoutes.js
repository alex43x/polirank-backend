import express from "express";
import studentController from "../controllers/studentController.js";
import roleMiddleware from "../middlewares/role.js";

const studentRoutes = express.Router();

studentRoutes.get("/", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Obtener todos los estudiantes'
     #swagger.description = 'Obtener la lista de todos los estudiantes con búsqueda, filtros y paginación. Solo ADMIN puede ver todos los estudiantes.'
     #swagger.parameters['page'] = {
       in: 'query',
       description: 'Número de página (default: 1)',
       required: false,
       type: 'integer',
     }
     #swagger.parameters['limit'] = {
       in: 'query',
       description: 'Cantidad de resultados por página (default: 10)',
       required: false,
       type: 'integer',
     }
     #swagger.parameters['search'] = {
       in: 'query',
       description: 'Buscar por nombre o correo',
       required: false,
       type: 'string',
     }
     #swagger.parameters['carrera_id'] = {
       in: 'query',
       description: 'Filtrar por ID de carrera',
       required: false,
       type: 'integer'
     }
     #swagger.parameters['rol_id'] = {
       in: 'query',
       description: 'Filtrar por ID de rol',
       required: false,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Lista de estudiantes obtenida exitosamente"
     }
  */
  studentController.getAllStudents
);

studentRoutes.get("/:id", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Obtener estudiante por ID'
     #swagger.description = 'Obtener un estudiante específico por su ID. Solo ADMIN puede ver la información de estudiantes.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID del estudiante',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Estudiante obtenido exitosamente"
     }
     #swagger.responses[404] = {
       description: "Usuario no encontrado"
     }
  */
  studentController.getStudentbyId
);

studentRoutes.get("/:id/reviews", 
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Obtener reviews de un estudiante'
     #swagger.description = 'Obtener todas las reviews creadas por un estudiante. Solo ADMIN puede ver las reviews de cualquier estudiante.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID del estudiante',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Reviews del estudiante obtenidas exitosamente"
     }
     #swagger.responses[404] = {
       description: "No se encontraron reseñas para este usuario"
     }
  */
  studentController.getStudentReviews
);

studentRoutes.post("/", roleMiddleware(['ADMIN']),
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Crear un nuevo estudiante'
     #swagger.description = 'Crear un nuevo estudiante. Solo ADMIN puede crear estudiantes.'
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             required: ["nombre", "correo", "password", "carrera", "rol"],
             properties: {
               nombre: {
                 type: "string",
                 example: "Juan Pérez",
                 description: "Nombre completo del estudiante"
               },
               correo: {
                 type: "string",
                 format: "email",
                 example: "juan.perez@example.com",
                 description: "Correo electrónico del estudiante"
               },
               password: {
                 type: "string",
                 format: "password",
                 example: "password123",
                 description: "Contraseña del estudiante"
               },
               carrera: {
                 type: "integer",
                 example: 1,
                 description: "ID de la carrera"
               },
               rol: {
                 type: "integer",
                 example: 2,
                 description: "ID del rol"
               }
             }
           }
         }
       }
     }
     #swagger.responses[201] = {
       description: "Estudiante creado exitosamente"
     }
     #swagger.responses[400] = {
       description: "Faltan campos requeridos"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos - Solo ADMIN"
     }
  */
  studentController.createStudent
);

studentRoutes.put("/:id", roleMiddleware(['ADMIN']),
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Actualizar un estudiante'
     #swagger.description = 'Actualizar la información de un estudiante existente. Solo ADMIN puede actualizar estudiantes.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID del estudiante a actualizar',
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
               nombre: {
                 type: "string",
                 example: "Juan Carlos Pérez",
                 description: "Nombre completo del estudiante"
               },
               correo: {
                 type: "string",
                 format: "email",
                 example: "juan.perez@example.com",
                 description: "Correo electrónico del estudiante"
               }
             }
           }
         }
       }
     }
     #swagger.responses[200] = {
       description: "Estudiante actualizado exitosamente"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos - Solo ADMIN"
     }
     #swagger.responses[404] = {
       description: "Usuario no encontrado"
     }
  */
  studentController.updateStudent
);

studentRoutes.delete("/:id", roleMiddleware(['ADMIN']),
  /* #swagger.tags = ['Alumnos']
     #swagger.summary = 'Eliminar un estudiante'
     #swagger.description = 'Eliminar un estudiante existente. Solo ADMIN puede eliminar estudiantes.'
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID del estudiante a eliminar',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: "Usuario eliminado"
     }
     #swagger.responses[401] = {
       description: "No autenticado"
     }
     #swagger.responses[403] = {
       description: "Sin permisos - Solo ADMIN"
     }
     #swagger.responses[404] = {
       description: "Usuario no encontrado"
     }
  */
  studentController.deleteStudent
);

export default studentRoutes;