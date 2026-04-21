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
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGci...
 *                     student:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nombre:
 *                           type: string
 *                           example: Jane Doe
 *                         correo:
 *                           type: string
 *                           example: estudiante@example.com
 *                         rol:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 2
 *                             nombre:
 *                               type: string
 *                               example: STUDENT
 *                         matriculaciones:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               carrera:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   nombre:
 *                                     type: string
 *                                     example: Ingeniería en Sistemas
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
 *         description: Perfil del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nombre:
 *                           type: string
 *                           example: Jane Doe
 *                         correo:
 *                           type: string
 *                           example: estudiante@example.com
 *                         rol:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 2
 *                             nombre:
 *                               type: string
 *                               example: STUDENT
 *                         matriculaciones:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               carrera:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   nombre:
 *                                     type: string
 *                                     example: Ingeniería en Sistemas
 *                     reviews:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 3
 *                         rows:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               fecha:
 *                                 type: string
 *                                 format: date-time
 *                                 example: '2024-01-15T10:00:00Z'
 *                               curso:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   year:
 *                                     type: integer
 *                                     example: 2024
 *                                   periodo:
 *                                     type: integer
 *                                     example: 1
 *                                   seccion:
 *                                     type: object
 *                                     nullable: true
 *                                     properties:
 *                                       id:
 *                                         type: integer
 *                                         example: 5
 *                                       docente:
 *                                         type: object
 *                                         nullable: true
 *                                         properties:
 *                                           id:
 *                                             type: integer
 *                                             example: 3
 *                                           nombre:
 *                                             type: string
 *                                             example: Juan Pérez
 *                                       materia:
 *                                         type: object
 *                                         nullable: true
 *                                         properties:
 *                                           id:
 *                                             type: integer
 *                                             example: 2
 *                                           nombre:
 *                                             type: string
 *                                             example: Cálculo I
 *                               detalles:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     aspecto:
 *                                       type: object
 *                                       nullable: true
 *                                       properties:
 *                                         id:
 *                                           type: integer
 *                                           example: 1
 *                                         nombre:
 *                                           type: string
 *                                           example: Puntualidad
 *                                     valor:
 *                                       type: integer
 *                                       example: 4
 *                     tries:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 2
 *                         rows:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               asignatura:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 2
 *                                   nombre:
 *                                     type: string
 *                                     example: Cálculo I
 *                               valor:
 *                                 type: integer
 *                                 example: 2
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
 *         description: Contraseña establecida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nombre:
 *                           type: string
 *                           example: Jane Doe
 *                         correo:
 *                           type: string
 *                           example: estudiante@example.com
 *                         rol:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 2
 *                             nombre:
 *                               type: string
 *                               example: STUDENT
 *                         matriculaciones:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               carrera:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   nombre:
 *                                     type: string
 *                                     example: Ingeniería en Sistemas
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
