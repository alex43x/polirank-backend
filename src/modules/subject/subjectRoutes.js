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
 *         description: Lista de materias paginada
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
 *                         example: Cálculo I
 *                       departamentoId:
 *                         type: integer
 *                         example: 1
 *                       departamento:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nombre:
 *                             type: string
 *                             example: Matemática
 *                           siglas:
 *                             type: string
 *                             example: MAT
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
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
 *         description: Materia encontrada
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
 *                       example: Cálculo I
 *                     departamentoId:
 *                       type: integer
 *                       example: 1
 *                     departamento:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nombre:
 *                           type: string
 *                           example: Matemática
 *                         siglas:
 *                           type: string
 *                           example: MAT
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
 *         description: Lista de secciones con estadísticas
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
 *                       section:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           docente:
 *                             type: integer
 *                             example: 3
 *                           asignatura:
 *                             type: integer
 *                             example: 1
 *                           Docente:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 3
 *                               nombre:
 *                                 type: string
 *                                 example: Juan Pérez
 *                               correo:
 *                                 type: string
 *                                 example: juan.perez@uni.edu
 *                       promedioGeneral:
 *                         type: number
 *                         format: float
 *                         example: 4.25
 *                       totalReviews:
 *                         type: integer
 *                         example: 12
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
 *         description: Distribución de intentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     1_intento:
 *                       type: integer
 *                       example: 45
 *                     2_intentos:
 *                       type: integer
 *                       example: 20
 *                     3_intentos:
 *                       type: integer
 *                       example: 10
 *                     mas_intentos:
 *                       type: integer
 *                       example: 5
 */
router.get('/:id/intentos', subjectController.getSubjectTriesStats);

export default router;
