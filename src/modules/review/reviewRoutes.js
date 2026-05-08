import { Router } from 'express';
import { requirePermission } from '../../shared/permissions/requirePermission.js';
import { createReviewRules } from './reviewValidators.js';
import { validate } from '../../shared/middlewares/validate.js';
import * as reviewController from './reviewController.js';

const router = Router();

/**
 * @openapi
 * /reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Listar todas las reviews
 *     description: Solo ADMIN.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: curso
 *         schema: { type: integer }
 *         description: Filtrar por ID de curso
 *       - in: query
 *         name: alumno
 *         schema: { type: integer }
 *         description: Filtrar por ID de alumno
 *     responses:
 *       200:
 *         description: Lista de reviews paginada
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
 *                       fecha:
 *                         type: string
 *                         format: date-time
 *                         example: '2024-01-15T10:00:00Z'
 *                       curso:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           year:
 *                             type: integer
 *                             example: 2024
 *                           periodo:
 *                             type: integer
 *                             example: 1
 *                           seccion:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 5
 *                               docente:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 3
 *                                   nombre:
 *                                     type: string
 *                                     example: Juan Pérez
 *                               materia:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 2
 *                                   nombre:
 *                                     type: string
 *                                     example: Cálculo I
 *                       detalles:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             aspecto:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 1
 *                                 nombre:
 *                                   type: string
 *                                   example: Puntualidad
 *                             valor:
 *                               type: integer
 *                               example: 4
 *                       alumno:
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
 *                       example: 30
 *                     totalPages:
 *                       type: integer
 *                       example: 3
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
router.get('/', requirePermission('review:read:all'), reviewController.getAllReviews);

/**
 * @openapi
 * /reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Obtener review por ID
 *     description: ADMIN puede ver cualquier review. STUDENT solo puede ver la propia.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review encontrada. ADMIN incluye campo alumno.
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
 *                     fecha:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:00:00Z'
 *                     curso:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         year:
 *                           type: integer
 *                           example: 2024
 *                         periodo:
 *                           type: integer
 *                           example: 1
 *                         seccion:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 5
 *                             docente:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 3
 *                                 nombre:
 *                                   type: string
 *                                   example: Juan Pérez
 *                             materia:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 2
 *                                 nombre:
 *                                   type: string
 *                                   example: Cálculo I
 *                     detalles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           aspecto:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               nombre:
 *                                 type: string
 *                                 example: Puntualidad
 *                           valor:
 *                             type: integer
 *                             example: 4
 *                     alumno:
 *                       description: Solo presente si el solicitante es ADMIN
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 5
 *                         nombre:
 *                           type: string
 *                           example: Jane Doe
 *                         correo:
 *                           type: string
 *                           example: jane@example.com
 *       403:
 *         description: Sin permiso para ver esta review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Review no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @openapi
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Crear review
 *     description: ADMIN y STUDENT. Un alumno solo puede tener una review por curso.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [curso, aspectos]
 *             properties:
 *               curso:
 *                 type: integer
 *                 example: 1
 *               aspectos:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [aspecto, valor]
 *                   properties:
 *                     aspecto:
 *                       type: integer
 *                       example: 1
 *                     valor:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 5
 *                       example: 4
 *     responses:
 *       201:
 *         description: Review creada
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
 *                     fecha:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:00:00Z'
 *                     curso:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         year:
 *                           type: integer
 *                           example: 2024
 *                         periodo:
 *                           type: integer
 *                           example: 1
 *                         seccion:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 5
 *                             docente:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 3
 *                                 nombre:
 *                                   type: string
 *                                   example: Juan Pérez
 *                             materia:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 2
 *                                 nombre:
 *                                   type: string
 *                                   example: Cálculo I
 *                     detalles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           aspecto:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               nombre:
 *                                 type: string
 *                                 example: Puntualidad
 *                           valor:
 *                             type: integer
 *                             example: 4
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ya existe una review de este alumno para este curso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requirePermission('review:write'), createReviewRules, validate, reviewController.createReview);

/**
 * @openapi
 * /reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Actualizar review
 *     description: Solo el autor puede actualizar su propia review.
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
 *               aspectos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     aspecto:
 *                       type: integer
 *                     valor:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 5
 *     responses:
 *       200:
 *         description: Review actualizada
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
 *                     fecha:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:00:00Z'
 *                     curso:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         year:
 *                           type: integer
 *                           example: 2024
 *                         periodo:
 *                           type: integer
 *                           example: 1
 *                         seccion:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 5
 *                             docente:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 3
 *                                 nombre:
 *                                   type: string
 *                                   example: Juan Pérez
 *                             materia:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 2
 *                                 nombre:
 *                                   type: string
 *                                   example: Cálculo I
 *                     detalles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           aspecto:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               nombre:
 *                                 type: string
 *                                 example: Puntualidad
 *                           valor:
 *                             type: integer
 *                             example: 4
 *       403:
 *         description: Sin permiso para actualizar esta review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Review no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', requirePermission('review:update'), reviewController.updateReview);

/**
 * @openapi
 * /reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Eliminar review
 *     description: Solo el autor puede eliminar su propia review.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review eliminada
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
 *                       example: Review eliminado exitosamente
 *       403:
 *         description: Sin permiso para eliminar esta review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Review no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requirePermission('review:delete'), reviewController.deleteReview);

export default router;
