import { Router } from 'express';
import * as authController from './authController.js';
import authMiddleware from '../../shared/middlewares/auth.js';
import { loginRules, createPasswordRules } from './authValidators.js';
import { validate } from '../../shared/middlewares/validate.js';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo, password]
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: estudiante@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso — retorna token y datos del usuario
 *       400:
 *         description: Campos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginRules, validate, authController.login);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario con reviews e intentos
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authMiddleware, authController.getUserProfile);

/**
 * @openapi
 * /auth/create-password:
 *   post:
 *     tags: [Auth]
 *     summary: Crear contraseña para usuario inactivo
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo, newPassword]
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: estudiante@example.com
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: nueva123
 *     responses:
 *       200:
 *         description: Contraseña creada y usuario activado
 *       400:
 *         description: Campos inválidos o usuario ya activo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Alumno no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-password', createPasswordRules, validate, authController.createPassword);

export default router;
