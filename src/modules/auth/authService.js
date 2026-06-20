import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Alumno from '../../models/studentModel.js';
import Rol from '../../models/roleModel.js';
import Carrera from '../../models/careerModel.js';
import Matriculacion from '../../models/enrollmentModel.js';
import ReviewCab from '../../models/reviewCab.js';
import Intento from '../../models/triesModel.js';
import { env } from '../../config/env.js';
import { UnauthorizedError, NotFoundError, ConflictError } from '../../shared/errors/httpErrors.js';
import AppError from '../../shared/errors/AppError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import { sendMail } from '../../shared/email/mailer.js';
import { authTemplate } from '../../shared/email/templates.js';

function withStudentAssociations() {
  return [
    { association: 'Rol' },
    {
      association: 'matriculaciones',
      attributes: ['id', 'carrera'],
      include: [{ association: 'Carrera', attributes: ['id', 'nombre'] }],
    },
  ];
}

function signAuthToken(student) {
  return jwt.sign(
    { id: student.id, correo: student.correo, rol: student.Rol, matriculaciones: student.matriculaciones },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
}

function verifyFlowToken(token) {
  try {
    const payload = jwt.verify(token, env.jwt.secret);
    if (payload.purpose !== 'auth-flow') {
      throw new AppError(ErrorCodes.TOKEN_INVALID.code, 400, 'Token inválido');
    }
    return payload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === 'TokenExpiredError') {
      throw new AppError(ErrorCodes.TOKEN_EXPIRED.code, 400, 'El enlace ha expirado. Solicitá uno nuevo.');
    }
    throw new AppError(ErrorCodes.TOKEN_INVALID.code, 400, 'Token inválido');
  }
}

export async function login(correo, password) {
  const loginUser = await Alumno.scope('withPassword').findOne({ where: { correo } });

  if (!loginUser || !(await bcrypt.compare(password, loginUser.password))) {
    throw new UnauthorizedError(ErrorCodes.AUTH_INVALID_CREDENTIALS.code, 'Credenciales inválidas');
  }

  await loginUser.update({ last_login: new Date() });

  const student = await Alumno.findByPk(loginUser.id, { include: withStudentAssociations() });

  const token = signAuthToken(student);
  return { token, student };
}

export async function getProfile(userId) {
  const student = await Alumno.findByPk(userId, { include: withStudentAssociations() });

  if (!student) {
    throw new NotFoundError(ErrorCodes.STUDENT_NOT_FOUND.code, 'Usuario no encontrado');
  }

  const [reviews, tries] = await Promise.all([
    ReviewCab.findAndCountAll({
      where: { alumno: userId },
      include: [
        { association: 'contenidos', include: [{ association: 'Aspecto' }] },
        { association: 'Curso', include: [{ association: 'Seccion', include: [{ association: 'Docente' }, { association: 'Materia' }] }] },
        { association: 'Comentario', include: [{ association: 'votos' }] },
      ],
    }),
    Intento.findAndCountAll({
      where: { alumno: userId },
      include: [{ association: 'Materia' }],
    }),
  ]);

  return { student, reviews, tries };
}

export async function requestAccess(correo) {
  const exists = !!(await Alumno.findOne({ where: { correo } }));

  const flowToken = jwt.sign({ correo, purpose: 'auth-flow' }, env.jwt.secret, { expiresIn: '1h' });
  const link = `${env.appUrl}/auth/verify?token=${flowToken}`;

  try {
    await sendMail({
      to: correo,
      subject: exists ? 'Restablecé tu contraseña — PoliRank' : 'Completá tu registro — PoliRank',
      html: authTemplate({ link, isNew: !exists }),
    });
  } catch {
    throw new AppError(ErrorCodes.INTERNAL_ERROR.code, 503, 'No se pudo enviar el correo. Intentá de nuevo más tarde.');
  }

  return { sent: true };
}

export async function verifyToken(token) {
  const payload = verifyFlowToken(token);
  const exists = !!(await Alumno.findOne({ where: { correo: payload.correo } }));
  return { correo: payload.correo, accountExists: exists };
}

export async function resetPassword(token, newPassword) {
  const payload = verifyFlowToken(token);

  const student = await Alumno.scope('withPassword').findOne({
    where: { correo: payload.correo },
    include: [{ association: 'Rol' }],
  });

  if (!student) {
    throw new NotFoundError(ErrorCodes.STUDENT_NOT_FOUND.code, 'Alumno no encontrado');
  }

  student.password = newPassword;

  if (student.Rol?.nombre === 'INACTIVE') {
    const studentRole = await Rol.findOne({ where: { nombre: 'STUDENT' } });
    student.rol = studentRole.id;
  }

  await student.save();

  const updated = await Alumno.findByPk(student.id, { include: withStudentAssociations() });
  const authToken = signAuthToken(updated);
  return { token: authToken, student: updated };
}

export async function register(token, { nombre, password, carreras }) {
  const payload = verifyFlowToken(token);

  const existing = await Alumno.findOne({ where: { correo: payload.correo } });
  if (existing) {
    throw new ConflictError(ErrorCodes.STUDENT_ALREADY_EXISTS.code, 'Ya existe una cuenta con este correo');
  }

  const [studentRole, carreraInstances] = await Promise.all([
    Rol.findOne({ where: { nombre: 'STUDENT' } }),
    Promise.all(carreras.map((id) => Carrera.findByPk(id))),
  ]);

  for (const c of carreraInstances) {
    if (!c) throw new NotFoundError(ErrorCodes.CAREER_NOT_FOUND.code, 'Una de las carreras no existe');
  }

  const newStudent = await Alumno.create({
    correo: payload.correo,
    nombre,
    password,
    rol: studentRole.id,
  });

  await Promise.all(
    carreras.map((carreraId) => Matriculacion.create({ alumno: newStudent.id, carrera: carreraId })),
  );

  const student = await Alumno.findByPk(newStudent.id, { include: withStudentAssociations() });
  const authToken = signAuthToken(student);
  return { token: authToken, student };
}
