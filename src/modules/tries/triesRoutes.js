import { Router } from 'express';
import { requirePermission } from '../../shared/permissions/requirePermission.js';
import { createTryRules, updateTryRules } from './triesValidators.js';
import { validate } from '../../shared/middlewares/validate.js';
import * as triesController from './triesController.js';

const router = Router();

/**
 * @openapi
 * /intentos:
 *   get:
 *     tags: [Intentos]
 *     summary: Obtener todos los intentos
 *     description: Solo ADMIN puede ver todos los intentos.
 *     responses:
 *       200:
 *         description: Lista de intentos obtenida exitosamente
 *       403:
 *         description: Sin permisos (requiere try:read:all)
 */
router.get('/', requirePermission('try:read:all'), triesController.getAllTries);

/**
 * @openapi
 * /intentos/{id}:
 *   get:
 *     tags: [Intentos]
 *     summary: Obtener intento por ID
 *     description: El STUDENT solo puede ver sus propios intentos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Intento obtenido exitosamente
 *       403:
 *         description: Sin permisos para ver este intento
 *       404:
 *         description: Intento no encontrado
 */
router.get('/:id', triesController.getTryById);

/**
 * @openapi
 * /intentos:
 *   post:
 *     tags: [Intentos]
 *     summary: Crear un nuevo intento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [asignatura, valor]
 *             properties:
 *               asignatura:
 *                 type: integer
 *                 example: 1
 *               valor:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: Intento creado exitosamente
 *       400:
 *         description: Campos inválidos o intento duplicado
 *       404:
 *         description: Asignatura no encontrada
 */
router.post('/', createTryRules, validate, triesController.createTry);

/**
 * @openapi
 * /intentos/{id}:
 *   put:
 *     tags: [Intentos]
 *     summary: Actualizar un intento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               asignatura:
 *                 type: integer
 *               valor:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Intento actualizado exitosamente
 *       403:
 *         description: Sin permisos para actualizar este intento
 *       404:
 *         description: Intento no encontrado
 */
router.put('/:id', updateTryRules, validate, triesController.updateTry);

/**
 * @openapi
 * /intentos/{id}:
 *   delete:
 *     tags: [Intentos]
 *     summary: Eliminar un intento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Intento eliminado exitosamente
 *       403:
 *         description: Sin permisos para eliminar este intento
 *       404:
 *         description: Intento no encontrado
 */
router.delete('/:id', triesController.deleteTry);

export default router;
