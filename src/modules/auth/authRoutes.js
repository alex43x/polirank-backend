import { Router } from 'express';
import * as authController from './authController.js';
import authMiddleware from '../../shared/middlewares/auth.js';
import {
  loginRules,
  forgotPasswordRules,
  verifyTokenRules,
  resetPasswordRules,
  registerRules,
  createPasswordRules,
} from './authValidators.js';
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
 *                 example: estudiante@fpuna.edu.py
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso — retorna JWT + datos del estudiante
 *       400:
 *         description: Campos inválidos o dominio no permitido
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', loginRules, validate, authController.login);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar enlace de acceso/registro
 *     description: Envía un correo con enlace válido 1 hora. Si la cuenta existe, es para restablecer contraseña; si no, para registrarse.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo]
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: estudiante@fpuna.edu.py
 *     responses:
 *       200:
 *         description: Correo enviado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     sent:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Correo inválido o dominio no permitido
 */
router.post('/forgot-password', forgotPasswordRules, validate, authController.forgotPassword);

/**
 * @openapi
 * /auth/verify-token:
 *   get:
 *     tags: [Auth]
 *     summary: Verificar token del enlace
 *     description: Decodifica el token y retorna el correo + si la cuenta ya existe. El frontend usa esto para mostrar "nueva contraseña" o "registro".
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     correo:
 *                       type: string
 *                       example: estudiante@fpuna.edu.py
 *                     accountExists:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Token inválido o expirado
 */
router.get('/verify-token', verifyTokenRules, validate, authController.verifyToken);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Restablecer contraseña (cuenta existente)
 *     description: Usa el token del enlace para establecer nueva contraseña. Si el usuario era INACTIVE, pasa a STUDENT. Retorna JWT + datos.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: nueva123
 *     responses:
 *       200:
 *         description: Contraseña actualizada — retorna JWT + datos del estudiante
 *       400:
 *         description: Token inválido/expirado o campos incorrectos
 *       404:
 *         description: Alumno no encontrado
 */
router.post('/reset-password', resetPasswordRules, validate, authController.resetPassword);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar cuenta nueva
 *     description: Usa el token del enlace para crear cuenta. Requiere nombre, contraseña y 1 o 2 carreras. Retorna JWT + datos.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, nombre, password, carreras]
 *             properties:
 *               token:
 *                 type: string
 *               nombre:
 *                 type: string
 *                 example: María González
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: mi_clave123
 *               carreras:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 2
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Cuenta creada — retorna JWT + datos del estudiante
 *       400:
 *         description: Token inválido/expirado, campos incorrectos o más de 2 carreras
 *       404:
 *         description: Carrera no encontrada
 *       409:
 *         description: Ya existe una cuenta con ese correo
 */
router.post('/register', registerRules, validate, authController.register);

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
 *         description: Perfil con reviews e intentos
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile', authMiddleware, authController.getUserProfile);

/**
 * @openapi
 * /auth/create-password:
 *   post:
 *     tags: [Auth]
 *     summary: Crear contraseña para usuario inactivo (legado)
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
 *                 example: estudiante@fpuna.edu.py
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: nueva123
 *     responses:
 *       200:
 *         description: Contraseña establecida
 *       400:
 *         description: Campos inválidos o usuario ya activo
 *       404:
 *         description: Alumno no existe
 */
router.post('/create-password', createPasswordRules, validate, authController.createPassword);

export default router;
