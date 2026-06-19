import { Router } from 'express';
import * as reportsController from './reportsController.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Reporte:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         comentario_id:
 *           type: integer
 *           example: 5
 *         reporter_id:
 *           type: integer
 *           example: 10
 *         reason_type:
 *           type: string
 *           example: spam
 *         reason_detail:
 *           type: string
 *           nullable: true
 *           example: Contiene publicidad
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           example: pending
 *         reviewed_by:
 *           type: integer
 *           nullable: true
 *         reviewed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         Comentario:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             texto:
 *               type: string
 *             is_banned:
 *               type: boolean
 *             created_at:
 *               type: string
 *               format: date-time
 *             ReviewCab:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 alumno:
 *                   type: integer
 *                 Alumno:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     correo:
 *                       type: string
 *         Reporter:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nombre:
 *               type: string
 *             correo:
 *               type: string
 *     ComentarioSimple:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         is_banned:
 *           type: boolean
 *         banned_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         texto:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /reports:
 *   get:
 *     tags: [Reportes]
 *     summary: Listar reportes pendientes
 *     description: Solo ADMIN. Devuelve los reportes con status pending.
 *     responses:
 *       200:
 *         description: Lista de reportes pendientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reporte'
 *       403:
 *         description: Sin permisos de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', reportsController.listReportesPendientes);

/**
 * @openapi
 * /reports/{reporteId}/aprobar:
 *   patch:
 *     tags: [Reportes]
 *     summary: Aprobar reporte y banear comentario
 *     description: Solo ADMIN. Cambia el status del reporte a approved, setea is_banned=true en el comentario.
 *     parameters:
 *       - in: path
 *         name: reporteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte a aprobar
 *     responses:
 *       200:
 *         description: Reporte aprobado, comentario baneado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Reporte'
 *       404:
 *         description: Reporte no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: El reporte ya fue revisado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:reporteId/aprobar', reportsController.aprobarReporte);

/**
 * @openapi
 * /reports/{reporteId}/rechazar:
 *   patch:
 *     tags: [Reportes]
 *     summary: Rechazar reporte
 *     description: Solo ADMIN. Cambia el status a rejected. El comentario permanece visible. Estado final.
 *     parameters:
 *       - in: path
 *         name: reporteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte a rechazar
 *     responses:
 *       200:
 *         description: Reporte rechazado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Reporte'
 *       404:
 *         description: Reporte no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: El reporte ya fue revisado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:reporteId/rechazar', reportsController.rechazarReporte);

/**
 * @openapi
 * /reports/comentarios/{comentarioId}/banear:
 *   patch:
 *     tags: [Reportes]
 *     summary: Banear comentario directamente
 *     description: Solo ADMIN. Banea un comentario sin necesidad de un reporte previo.
 *     parameters:
 *       - in: path
 *         name: comentarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del comentario a banear
 *     responses:
 *       200:
 *         description: Comentario baneado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ComentarioSimple'
 *       404:
 *         description: Comentario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/comentarios/:comentarioId/banear', reportsController.banearComentario);

export default router;
