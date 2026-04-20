import { Router } from 'express';
import { requirePermission } from '../../shared/permissions/requirePermission.js';
import { getAllSubjectsRules } from './subjectValidators.js';
import { validate } from '../../shared/middlewares/validate.js';
import * as subjectController from './subjectController.js';

const router = Router();

/**
 * @openapi
 * /materias:
 *   get:
 *     tags: [Materias]
 *     summary: Obtener todas las materias
 *     description: Lista de materias con filtros según el rol. ADMIN ve todas; STUDENT solo las de su carrera (requiere X-Carrera-Id header).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre
 *       - in: query
 *         name: dpto_id
 *         schema: { type: integer }
 *       - in: query
 *         name: career_id
 *         schema: { type: integer }
 *         description: Solo ADMIN
 *       - in: query
 *         name: semester
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista obtenida exitosamente
 *       401:
 *         description: No autenticado
 */
router.get('/', getAllSubjectsRules, validate, subjectController.getAllSubjects);

/**
 * @openapi
 * /materias/{id}:
 *   get:
 *     tags: [Materias]
 *     summary: Obtener materia por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Materia obtenida exitosamente
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Materia no encontrada
 */
router.get('/:id', subjectController.getSubjectById);

/**
 * @openapi
 * /materias/{id}/secciones:
 *   get:
 *     tags: [Materias]
 *     summary: Obtener estadísticas de secciones de una materia
 *     description: Retorna las secciones de una materia con su promedio general y total de reseñas, ordenadas de mayor a menor promedio.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       403:
 *         description: Sin permisos
 */
router.get('/:id/secciones', subjectController.getSectionsStatsBySubjectId);

/**
 * @openapi
 * /materias/{id}/intentos:
 *   get:
 *     tags: [Materias]
 *     summary: Obtener distribución de intentos de una materia
 *     description: Retorna la distribución de estudiantes agrupados por número de intentos (1, 2, 3, más).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/:id/intentos', subjectController.getSubjectTriesStats);

export default router;
