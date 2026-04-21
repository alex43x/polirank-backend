import { Router } from 'express';
import * as studentController from './studentController.js';
import { requirePermission } from '../../shared/permissions/requirePermission.js';
import { createStudentRules, updateStudentRules } from './studentValidators.js';
import { validate } from '../../shared/middlewares/validate.js';

const router = Router();

/**
 * @openapi
 * /alumnos:
 *   get:
 *     tags: [Alumnos]
 *     summary: Listar todos los estudiantes
 *     description: Solo ADMIN. Soporta búsqueda, filtros y paginación.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre o correo
 *       - in: query
 *         name: carrera_id
 *         schema: { type: integer }
 *       - in: query
 *         name: rol_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de estudiantes paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nombre:
 *                         type: string
 *                         example: Jane Doe
 *                       correo:
 *                         type: string
 *                         example: jane@example.com
 *                       rol:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 2
 *                           nombre:
 *                             type: string
 *                             example: STUDENT
 *                       matriculaciones:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             carrera:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 1
 *                                 nombre:
 *                                   type: string
 *                                   example: Ingeniería en Sistemas
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 80
 *                     totalPages:
 *                       type: integer
 *                       example: 8
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       403:
 *         description: Sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', studentController.getAllStudents);

/**
 * @openapi
 * /alumnos/{id}:
 *   get:
 *     tags: [Alumnos]
 *     summary: Obtener estudiante por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Estudiante encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Jane Doe
 *                     correo:
 *                       type: string
 *                       example: jane@example.com
 *                     rol:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 2
 *                         nombre:
 *                           type: string
 *                           example: STUDENT
 *                     matriculaciones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           carrera:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               nombre:
 *                                 type: string
 *                                 example: Ingeniería en Sistemas
 *       404:
 *         description: Alumno no encontrado
 */
router.get('/:id', studentController.getStudentById);

/**
 * @openapi
 * /alumnos/{id}/reviews:
 *   get:
 *     tags: [Alumnos]
 *     summary: Obtener reviews de un estudiante
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reviews del estudiante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       curso:
 *                         type: integer
 *                         example: 1
 *                       alumno:
 *                         type: integer
 *                         example: 5
 *                       fecha:
 *                         type: string
 *                         format: date-time
 *                         example: '2024-01-15T10:00:00Z'
 *                       contenidos:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             aspecto:
 *                               type: integer
 *                               example: 1
 *                             valor:
 *                               type: integer
 *                               example: 4
 *                             Aspecto:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 1
 *                                 nombre:
 *                                   type: string
 *                                   example: Puntualidad
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 5
 *       404:
 *         description: Alumno no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/reviews', studentController.getStudentReviews);

/**
 * @openapi
 * /alumnos:
 *   post:
 *     tags: [Alumnos]
 *     summary: Crear nuevo estudiante
 *     description: Solo ADMIN.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, correo, password, rol]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *               rol:
 *                 type: integer
 *                 example: 2
 *               matriculaciones:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Estudiante creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Juan Pérez
 *                     correo:
 *                       type: string
 *                       example: juan@example.com
 *                     rol:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 2
 *                         nombre:
 *                           type: string
 *                           example: STUDENT
 *                     matriculaciones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           carrera:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               nombre:
 *                                 type: string
 *                                 example: Ingeniería en Sistemas
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requirePermission('student:write'), createStudentRules, validate, studentController.createStudent);

/**
 * @openapi
 * /alumnos/{id}:
 *   put:
 *     tags: [Alumnos]
 *     summary: Actualizar datos del estudiante
 *     description: Solo ADMIN.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Carlos Pérez
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *     responses:
 *       200:
 *         description: Estudiante actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Juan Carlos Pérez
 *                     correo:
 *                       type: string
 *                       example: juan@example.com
 *                     rol:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 2
 *                         nombre:
 *                           type: string
 *                           example: STUDENT
 *                     matriculaciones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           carrera:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               nombre:
 *                                 type: string
 *                                 example: Ingeniería en Sistemas
 *       404:
 *         description: Alumno no encontrado
 */
router.put('/:id', requirePermission('student:write'), updateStudentRules, validate, studentController.updateStudent);

/**
 * @openapi
 * /alumnos/{id}:
 *   delete:
 *     tags: [Alumnos]
 *     summary: Eliminar estudiante
 *     description: Solo ADMIN.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Estudiante eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Alumno eliminado
 *       404:
 *         description: Alumno no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requirePermission('student:write'), studentController.deleteStudent);

export default router;
