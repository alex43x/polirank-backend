import { Router } from 'express';
import { getAllCourses, getCourseById, getReviewsByCourse } from './courseController.js';
import { listCoursesRules } from './courseValidators.js';
import { validate } from '../../shared/middlewares/validate.js';

const router = Router();

/**
 * @openapi
 * /cursos:
 *   get:
 *     tags: [Cursos]
 *     summary: Listar todos los cursos
 *     description: Solo ADMIN.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista de cursos paginada
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
 *                       year:
 *                         type: integer
 *                         example: 2024
 *                       periodo:
 *                         type: integer
 *                         example: 1
 *                       seccion:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           docente:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 3
 *                               nombre:
 *                                 type: string
 *                                 example: Juan Pérez
 *                           materia:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 2
 *                               nombre:
 *                                 type: string
 *                                 example: Cálculo I
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
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
router.get('/', listCoursesRules, validate, getAllCourses);

/**
 * @openapi
 * /cursos/{id}:
 *   get:
 *     tags: [Cursos]
 *     summary: Obtener curso por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Curso encontrado
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
 *                     year:
 *                       type: integer
 *                       example: 2024
 *                     periodo:
 *                       type: integer
 *                       example: 1
 *                     seccion:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 5
 *                         docente:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 3
 *                             nombre:
 *                               type: string
 *                               example: Juan Pérez
 *                         materia:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 2
 *                             nombre:
 *                               type: string
 *                               example: Cálculo I
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getCourseById);

/**
 * @openapi
 * /cursos/{id}/reviews:
 *   get:
 *     tags: [Cursos]
 *     summary: Obtener reviews de un curso
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Reviews del curso paginadas
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
 *                       Alumno:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           nombre:
 *                             type: string
 *                             example: Jane Doe
 *                           correo:
 *                             type: string
 *                             example: jane@example.com
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/reviews', listCoursesRules, validate, getReviewsByCourse);

export default router;
