import { Router } from 'express';
import { getAllTeachersRules } from './teacherValidators.js';
import { validate } from '../../shared/middlewares/validate.js';
import * as teacherController from './teacherController.js';

const router = Router();

/**
 * @openapi
 * /docentes:
 *   get:
 *     tags: [Docentes]
 *     summary: Obtener todos los docentes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de docentes
 */
router.get('/', getAllTeachersRules, validate, teacherController.getAllTeachers);

/**
 * @openapi
 * /docentes/{id}:
 *   get:
 *     tags: [Docentes]
 *     summary: Obtener docente por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Docente encontrado
 *       404:
 *         description: Docente no encontrado
 */
router.get('/:id', teacherController.getTeacherById);

/**
 * @openapi
 * /docentes/{id}/secciones:
 *   get:
 *     tags: [Docentes]
 *     summary: Obtener estadísticas de secciones de un docente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Secciones con estadísticas
 *       404:
 *         description: Docente no encontrado
 */
router.get('/:id/secciones', teacherController.getSectionsStatsByTeacherId);

/**
 * @openapi
 * /docentes/{id}/cursos:
 *   get:
 *     tags: [Docentes]
 *     summary: Obtener todos los cursos de un docente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de cursos
 *       404:
 *         description: Docente no encontrado
 */
router.get('/:id/cursos', teacherController.getCoursesByTeacherId);

export default router;
