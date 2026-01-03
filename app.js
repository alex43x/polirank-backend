import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import createError from 'http-errors';
import authRoutes from './routes/auth.js';

/*
import userRoutes from './routes/user.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import reviewRoutes from './routes/review.routes.js';
import tryRoutes from './routes/try.routes.js';

*/
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

/*  Middlewares globales */
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


/* Rutas */
/*
app.use('/users', userRoutes);
app.use('/subjects', subjectRoutes);
app.use('/reviews', reviewRoutes);
app.use('/tries', tryRoutes);
*/
app.use('/auth', authRoutes);
/* Ruta no encontrada  */
app.use((req, res, next) => {
  next(createError(404, 'Ruta no encontrada'));
});

/* Middleware de errores */
//app.use(errorHandler);

export default app;
