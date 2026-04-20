import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Alumno from '../../models/studentModel.js';
import Rol from '../../models/roleModel.js';
import Carrera from '../../models/careerModel.js';
import Matriculacion from '../../models/enrollmentModel.js';
import Aspecto from '../../models/aspectModel.js';
import ReviewCont from '../../models/reviewCont.js';
import ReviewCab from '../../models/reviewCab.js';
import Intento from '../../models/triesModel.js';
import Curso from '../../models/courseModel.js';
import Seccion from '../../models/sectionModel.js';
import Docente from '../../models/teacherModel.js';
import Materia from '../../models/subjectModel.js';
import { env } from '../../config/env.js';
import { UnauthorizedError, NotFoundError, ConflictError } from '../../shared/errors/httpErrors.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';

function withStudentAssociations() {
  return [
    { model: Rol },
    {
      model: Matriculacion,
      attributes: ['id', 'carrera'],
      include: [{ model: Carrera, attributes: ['id', 'nombre'] }],
    },
  ];
}

export async function login(correo, password) {
  const loginUser = await Alumno.scope('withPassword').findOne({ where: { correo } });

  if (!loginUser || !(await bcrypt.compare(password, loginUser.password))) {
    throw new UnauthorizedError(ErrorCodes.AUTH_INVALID_CREDENTIALS.code, 'Credenciales inválidas');
  }

  const student = await Alumno.findByPk(loginUser.id, { include: withStudentAssociations() });

  const token = jwt.sign(
    { id: student.id, correo: student.correo, rol: student.Rol },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );

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
        { model: ReviewCont, include: [{ model: Aspecto }] },
        { model: Curso, include: [{ model: Seccion, include: [{ model: Docente }, { model: Materia }] }] },
      ],
    }),
    Intento.findAndCountAll({
      where: { alumno: userId },
      include: [{ model: Materia }],
    }),
  ]);

  return { student, reviews, tries };
}

export async function createPassword(correo, newPassword) {
  const [student, studentRole] = await Promise.all([
    Alumno.findOne({
      where: { correo },
      include: [{ model: Rol }, { model: Matriculacion, include: [{ model: Carrera }] }],
    }),
    Rol.findOne({ where: { nombre: 'STUDENT' } }),
  ]);

  if (!student) {
    throw new NotFoundError(ErrorCodes.STUDENT_NOT_FOUND.code, 'Alumno no existe');
  }
  if (student.Rol.nombre !== 'INACTIVE') {
    throw new ConflictError(ErrorCodes.USER_ALREADY_ACTIVE.code, 'Usuario ya activo');
  }

  student.password = newPassword;
  student.rol = studentRole.id;
  await student.save();

  return Alumno.findByPk(student.id, { include: withStudentAssociations() });
}
