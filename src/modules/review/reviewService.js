import ReviewCab from '../../models/reviewCab.js';
import ReviewCont from '../../models/reviewCont.js';
import Curso from '../../models/courseModel.js';
import Alumno from '../../models/studentModel.js';
import Aspecto from '../../models/aspectModel.js';
import Section from '../../models/sectionModel.js';
import Teacher from '../../models/teacherModel.js';
import Subject from '../../models/subjectModel.js';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors/httpErrors.js';
import AppError from '../../shared/errors/AppError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';

function withReviewAssociations(filters = {}) {
  const { docente, materia } = filters;
  return [
    {
      model: ReviewCont,
      include: [{ model: Aspecto }],
      order: [['id', 'ASC']],
    },
    {
      model: Curso,
      include: [
        {
          model: Section,
          attributes: ['id'],
          include: [
            { model: Teacher, ...(docente && { where: { id: docente } }) },
            { model: Subject, ...(materia && { where: { id: materia } }) },
          ],
        },
      ],
    },
    { model: Alumno, attributes: ['id', 'nombre', 'correo'] },
  ];
}

export async function getAllReviews({ page = 1, limit = 10, curso, alumno } = {}) {
  const offset = (page - 1) * limit;
  const where = {};
  if (curso) where.curso = curso;
  if (alumno) where.alumno = alumno;

  return ReviewCab.findAndCountAll({
    where,
    include: withReviewAssociations(),
    order: [['fecha', 'DESC'], [ReviewCont, Aspecto, 'id', 'ASC']],
    limit,
    offset,
    distinct: true,
  });
}

export async function getReviewById(id, { userId, isAdmin }) {
  const review = await ReviewCab.findByPk(id, { include: withReviewAssociations() });
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  if (!isAdmin && review.alumno !== userId) {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permiso para ver este review');
  }

  return review;
}

export async function createReview({ curso, aspectos }, alumnoId) {
  const courseExists = await Curso.findByPk(curso);
  if (!courseExists) throw new NotFoundError(ErrorCodes.COURSE_NOT_FOUND.code, 'El curso no existe');

  const reviewExistente = await ReviewCab.findOne({ where: { curso, alumno: alumnoId } });
  if (reviewExistente) {
    throw new ConflictError(ErrorCodes.REVIEW_ALREADY_EXISTS.code, 'Ya existe una review de este alumno para este curso');
  }

  for (const item of aspectos) {
    const exists = await Aspecto.findByPk(item.aspecto);
    if (!exists) throw new NotFoundError(ErrorCodes.ASPECT_NOT_FOUND.code, `El aspecto con id ${item.aspecto} no existe`);
  }

  const reviewCab = await ReviewCab.create({ curso, alumno: alumnoId });
  await Promise.all(
    aspectos.map((item) => ReviewCont.create({ revcab: reviewCab.id, aspecto: item.aspecto, valor: item.valor }))
  );

  return ReviewCab.findByPk(reviewCab.id, { include: withReviewAssociations() });
}

export async function updateReview(id, { aspectos }, userId) {
  const review = await ReviewCab.findByPk(id);
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  if (review.alumno !== userId) {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permiso para actualizar este review');
  }

  if (aspectos) {
    for (const item of aspectos) {
      if (item.valor < 1 || item.valor > 5) {
        throw new ValidationError(ErrorCodes.VALIDATION_ERROR.code, 'El valor debe estar entre 1 y 5', [
          { field: 'aspectos.*.valor', code: 'invalid_value', message: 'El valor debe estar entre 1 y 5' },
        ]);
      }
      const exists = await Aspecto.findByPk(item.aspecto);
      if (!exists) throw new NotFoundError(ErrorCodes.ASPECT_NOT_FOUND.code, `El aspecto con id ${item.aspecto} no existe`);

      const [updated] = await ReviewCont.update(
        { valor: item.valor },
        { where: { revcab: id, aspecto: item.aspecto } },
      );
      if (updated === 0) {
        throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, `El aspecto ${item.aspecto} no existe en este review`);
      }
    }
  }

  return ReviewCab.findByPk(id, { include: withReviewAssociations() });
}

export async function deleteReview(id, userId) {
  const review = await ReviewCab.findByPk(id);
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  if (review.alumno !== userId) {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tienes permiso para eliminar este review');
  }

  await ReviewCont.destroy({ where: { revcab: id } });
  await ReviewCab.destroy({ where: { id } });
}
