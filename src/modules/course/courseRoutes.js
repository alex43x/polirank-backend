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
 *         description: Lista paginada de cursos
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
 *         description: Datos del curso
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
 *         description: Reviews del curso
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/reviews', listCoursesRules, validate, getReviewsByCourse);

export default router;
