import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './modules/auth/authRoutes.js';
import studentRoutes from './modules/student/studentRoutes.js';
import courseRoutes from './modules/course/courseRoutes.js';
import reviewRoutes from './modules/review/reviewRoutes.js';
import reportsRoutes from './modules/reports/reportsRoutes.js';
import subjectRoutes from './modules/subject/subjectRoutes.js';
import teacherRoutes from './modules/teacher/teacherRoutes.js';
import triesRoutes from './modules/tries/triesRoutes.js';
import sectionRoutes from './modules/section/sectionRoutes.js';
import authMiddleware from './shared/middlewares/auth.js';
import { requirePermission } from './shared/permissions/requirePermission.js';
import errorHandler from './shared/middlewares/errorHandler.js';
import { globalLimiter } from './shared/middlewares/rateLimiter.js';
import { NotFoundError } from './shared/errors/httpErrors.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(globalLimiter);

app.use('/auth',     authRoutes);
app.use('/alumnos',  authMiddleware, requirePermission('student:read'),  studentRoutes);
app.use('/materias', authMiddleware, requirePermission('subject:read'),  subjectRoutes);
app.use('/docentes', authMiddleware, requirePermission('teacher:read'),  teacherRoutes);
app.use('/cursos',   authMiddleware, requirePermission('course:read'),   courseRoutes);
app.use('/sections', authMiddleware, requirePermission('section:read'),  sectionRoutes);
app.use('/reviews',  authMiddleware, requirePermission('review:access'),     reviewRoutes);
app.use('/reports',  authMiddleware, requirePermission('review:read:all'),  reportsRoutes);
app.use('/intentos', authMiddleware, requirePermission('try:access'),       triesRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.get('/', (req, res) => res.json('Hello world'));

app.use((_req, _res, next) => {
  next(new NotFoundError('route_not_found', 'Ruta no encontrada'));
});

app.use(errorHandler);

export default app;
