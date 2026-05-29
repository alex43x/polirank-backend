import { Router } from 'express';
import { requirePermission } from '../../shared/permissions/requirePermission.js';
import { createReviewRules, votoComentarioRules, reporteComentarioRules } from './reviewValidators.js';
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
 *               texto:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Comentario opcional del alumno sobre el curso
 *                 example: Excelente docente, muy claro en sus explicaciones.
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
 *               texto:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Crea o actualiza el comentario de la review. Si se omite, no se modifica.
 *                 example: Actualicé mi opinión sobre el docente.
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

/**
 * @openapi
 * /reviews/{id}/comentario:
 *   delete:
 *     tags: [Reviews]
 *     summary: Eliminar comentario de una review
 *     description: Solo el autor de la review puede eliminar el comentario. Elimina también los votos asociados.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Comentario eliminado
 *       404:
 *         description: Review o comentario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id/comentario', requirePermission('review:update'), reviewController.deleteComentario);

/**
 * @openapi
 * /reviews/{id}/comentario/voto:
 *   post:
 *     tags: [Reviews]
 *     summary: Votar un comentario
 *     description: Cualquier usuario autenticado puede votar. No se puede votar el propio comentario. Si ya votó, actualiza el voto.
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
 *             required: [valor]
 *             properties:
 *               valor:
 *                 type: integer
 *                 enum: [-1, 1]
 *                 description: 1 = útil, -1 = no útil
 *                 example: 1
 *     responses:
 *       200:
 *         description: Voto registrado, devuelve la review con puntuación actualizada
 *       403:
 *         description: No podés votar tu propio comentario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Reviews]
 *     summary: Eliminar voto de un comentario
 *     description: Elimina el voto del usuario autenticado en el comentario de la review.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Voto eliminado
 *       404:
 *         description: Voto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/comentario/voto', requirePermission('review:access'), votoComentarioRules, validate, reviewController.voteComentario);
router.delete('/:id/comentario/voto', requirePermission('review:access'), reviewController.deleteVoteComentario);

router.post('/:id/comentario/reporte', requirePermission('review:write'), reporteComentarioRules, validate, reviewController.reportComentario);

export default router;
