import { Router } from 'express';
import * as careerController from './careerController.js';

const router = Router();

/**
 * @openapi
 * /carreras:
 *   get:
 *     tags: [Carreras]
 *     summary: Obtener todas las carreras
 *     description: Retorna la lista completa de carreras disponibles en la facultad.
 *     responses:
 *       200:
 *         description: Lista de carreras
 */
router.get('/', careerController.getAllCareers);

export default router;
