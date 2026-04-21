import { Router } from 'express';
import { requirePermission } from '../../shared/permissions/requirePermission.js';
import * as sectionController from './sectionController.js';

const router = Router();

/**
 * @openapi
 * /sections/{id}/last:
 *   get:
 *     tags: [Secciones]
 *     summary: Obtener últimas estadísticas de sección
 *     description: Retorna las estadísticas del último curso de una sección, promediando los aspectos y el total de reseñas.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sección
 *     responses:
 *       200:
 *         description: Últimas estadísticas de la sección
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           seccion:
 *                             type: integer
 *                             example: 3
 *                           year:
 *                             type: integer
 *                             example: 2024
 *                           periodo:
 *                             type: integer
 *                             example: 1
 *                     stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           aspecto:
 *                             type: integer
 *                             example: 1
 *                           promedio:
 *                             type: string
 *                             example: '4.20'
 *                           count:
 *                             type: integer
 *                             example: 2
 *                           aspect:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               nombre:
 *                                 type: string
 *                                 example: Puntualidad
 *                     promedioGeneral:
 *                       type: number
 *                       format: float
 *                       example: 4.15
 *                     totalReviews:
 *                       type: integer
 *                       example: 20
 *       404:
 *         description: Sección no encontrada
 */
router.get('/:id/last', requirePermission('section:read'), sectionController.getSectionLastStats);

/**
 * @openapi
 * /sections/{id}/history:
 *   get:
 *     tags: [Secciones]
 *     summary: Obtener historial de estadísticas de sección
 *     description: Retorna el historial completo de estadísticas de todos los cursos de una sección.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sección
 *     responses:
 *       200:
 *         description: Historial de estadísticas de la sección
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *                     courseStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           curso:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               seccion:
 *                                 type: integer
 *                                 example: 3
 *                               year:
 *                                 type: integer
 *                                 example: 2024
 *                               periodo:
 *                                 type: integer
 *                                 example: 1
 *                           stats:
 *                             type: object
 *                             properties:
 *                               count:
 *                                 type: integer
 *                                 example: 6
 *                               rows:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     aspecto:
 *                                       type: integer
 *                                       example: 1
 *                                     promedio:
 *                                       type: string
 *                                       example: '4.50'
 *                                     cantidad:
 *                                       type: integer
 *                                       example: 15
 *                           promedioGeneral:
 *                             type: number
 *                             format: float
 *                             example: 4.5
 *                           totalReviews:
 *                             type: integer
 *                             example: 15
 *                     totalPromedio:
 *                       type: number
 *                       format: float
 *                       example: 4.2
 */
router.get('/:id/history', requirePermission('section:read'), sectionController.getSectionHistoryStats);

/**
 * @openapi
 * /sections/{id}/cursos:
 *   get:
 *     tags: [Secciones]
 *     summary: Obtener cursos de una sección
 *     description: Retorna todos los cursos de una sección ordenados por año y periodo descendente.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sección
 *     responses:
 *       200:
 *         description: Cursos de la sección
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     cursos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           seccion:
 *                             type: integer
 *                             example: 3
 *                           year:
 *                             type: integer
 *                             example: 2024
 *                           periodo:
 *                             type: integer
 *                             example: 1
 *                     count:
 *                       type: integer
 *                       example: 4
 */
router.get('/:id/cursos', requirePermission('section:read'), sectionController.getCoursesBySection);

export default router;
