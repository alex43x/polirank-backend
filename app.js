import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import createError from 'http-errors';
import authRoutes from './routes/authRoutes.js';
// import swaggerUi from 'swagger-ui-express'
// import swaggerFile from  './swagger_output.json' assert { type: "json" };
// import reviewRoutes from './routes/reviewRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import subjectRoutes from './routes/subjectRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
// import reviewRoutes from './routes/reviewRoutes.js';
// import triesRoutes from './routes/triesRoutes.js';
// import courseRoutes from './routes/courseRoutes.js';
import authMiddleware from './middlewares/auth.js';
import roleMiddleware from './middlewares/role.js';

dotenv.config();

const app = express();

/*  Middlewares globales */
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


/* Rutas */
app.use('/auth', authRoutes);
app.use('/alumnos', authMiddleware, roleMiddleware(['ADMIN']), studentRoutes);
app.use('/materias', authMiddleware, roleMiddleware(['ADMIN', 'STUDENT']), subjectRoutes);
// app.use('/cursos', authMiddleware, roleMiddleware(['ADMIN', 'STUDENT']), courseRoutes);
// app.use('/reviews', authMiddleware, roleMiddleware(['ADMIN', 'STUDENT']), reviewRoutes);
// app.use('/intentos', authMiddleware, roleMiddleware(['ADMIN', 'STUDENT']), triesRoutes);
// app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.get('/', (request, response) => {
  response.json('Hello world')
})

/* Ruta no encontrada  */
app.use((req, res, next) => {
  next(createError(404, 'Ruta no encontrada'));
});

/* Middleware de errores */
//app.use(errorHandler);

export default app;
