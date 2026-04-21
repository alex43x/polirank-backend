import { Op } from "sequelize";
import Alumno from "../../models/studentModel.js";
import Matriculacion from "../../models/enrollmentModel.js";
import Carrera from "../../models/careerModel.js";
import ReviewCab from "../../models/reviewCab.js";
import ReviewCont from "../../models/reviewCont.js";
import Aspecto from "../../models/aspectModel.js";
import Intento from "../../models/triesModel.js";
import { NotFoundError } from "../../shared/errors/httpErrors.js";
import { ErrorCodes } from "../../shared/errors/errorCodes.js";

function withAssociations() {
  return [
    { association: "Rol", attributes: ["id", "nombre"] },
    {
      association: "matriculaciones",
      attributes: ["id", "carrera"],
      include: [{ association: "Carrera" }],
    },
  ];
}

export async function getAllStudents(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit;
  const { search, rol_id } = filters;

  const where = {};
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { correo: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (rol_id) where.rol = rol_id;

  return Alumno.findAndCountAll({
    where,
    include: withAssociations(),
    order: [["id", "ASC"]],
    limit,
    offset,
  });
}

export async function getStudentById(id) {
  const student = await Alumno.findByPk(id, { include: withAssociations() });
  if (!student)
    throw new NotFoundError(
      ErrorCodes.STUDENT_NOT_FOUND.code,
      "Alumno no encontrado",
    );
  return student;
}

export async function getStudentReviews(id) {
  await getStudentById(id);
  return ReviewCab.findAndCountAll({
    where: { alumno: id },
    include: [
      { association: "contenidos", include: [{ association: "Aspecto" }] },
    ],
  });
}

export async function createStudent({
  nombre,
  correo,
  password,
  rol,
  matriculaciones,
}) {
  const student = await Alumno.create({ nombre, correo, password, rol });

  if (Array.isArray(matriculaciones) && matriculaciones.length > 0) {
    await Promise.all(
      matriculaciones.map((carrera_id) =>
        Matriculacion.create({ alumno: student.id, carrera: carrera_id }),
      ),
    );
  }

  return Alumno.findByPk(student.id, { include: withAssociations() });
}

export async function updateStudent(
  id,
  { nombre, correo, rol, matriculaciones },
) {
  const student = await Alumno.findByPk(id);
  if (!student)
    throw new NotFoundError(
      ErrorCodes.STUDENT_NOT_FOUND.code,
      "Alumno no encontrado",
    );

  await student.update({ nombre, correo, rol });

  if (Array.isArray(matriculaciones)) {
    await Matriculacion.destroy({ where: { alumno: id } });
    await Promise.all(
      matriculaciones.map((carrera_id) =>
        Matriculacion.create({ alumno: id, carrera: carrera_id }),
      ),
    );
  }

  return Alumno.findByPk(id, { include: withAssociations() });
}

export async function deleteStudent(id) {
  const student = await Alumno.findByPk(id);
  if (!student)
    throw new NotFoundError(
      ErrorCodes.STUDENT_NOT_FOUND.code,
      "Alumno no encontrado",
    );

  const reviews = await ReviewCab.findAll({
    where: { alumno: id },
    attributes: ["id"],
  });
  const reviewIds = reviews.map((r) => r.id);
  if (reviewIds.length > 0) {
    await ReviewCont.destroy({ where: { revcab: reviewIds } });
  }
  await ReviewCab.destroy({ where: { alumno: id } });
  await Intento.destroy({ where: { alumno: id } });
  await Matriculacion.destroy({ where: { alumno: id } });
  await Alumno.destroy({ where: { id } });
}
