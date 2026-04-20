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
 *         description: Estadísticas obtenidas exitosamente
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
 *         description: Historial obtenido exitosamente
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
 *         description: Cursos obtenidos exitosamente
 */
router.get('/:id/cursos', requirePermission('section:read'), sectionController.getCoursesBySection);

export default router;
