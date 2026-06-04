import ReviewCab from '../../models/reviewCab.js';
import ReviewCont from '../../models/reviewCont.js';
import Curso from '../../models/courseModel.js';
import Alumno from '../../models/studentModel.js';
import Aspecto from '../../models/aspectModel.js';
import Section from '../../models/sectionModel.js';
import Teacher from '../../models/teacherModel.js';
import Subject from '../../models/subjectModel.js';
import Comentario from '../../models/commentModel.js';
import VotoComentario from '../../models/commentVoteModel.js';
import ReporteComentario from '../../models/reportModel.js';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors/httpErrors.js';
import AppError from '../../shared/errors/AppError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';

function withReviewAssociations(filters = {}) {
  const { docente, materia } = filters;
  return [
    {
      association: 'contenidos',
      include: [{ association: 'Aspecto' }],
      order: [['id', 'ASC']],
    },
    {
      association: 'Curso',
      include: [
        {
          association: 'Seccion',
          attributes: ['id'],
          include: [
            { association: 'Docente', ...(docente && { where: { id: docente } }) },
            { association: 'Materia', ...(materia && { where: { id: materia } }) },
          ],
        },
      ],
    },
    { association: 'Alumno', attributes: ['id', 'nombre', 'correo'] },
    { association: 'Comentario', include: [{ association: 'votos' }] },
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
    order: [['fecha', 'DESC'], [{ model: ReviewCont, as: 'contenidos' }, { model: Aspecto, as: 'Aspecto' }, 'id', 'ASC']],
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

export async function createReview({ curso, aspectos, texto }, alumnoId) {
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

  if (texto) await Comentario.create({ revcab: reviewCab.id, texto, aprobado: false });

  return ReviewCab.findByPk(reviewCab.id, { include: withReviewAssociations() });
}

export async function updateReview(id, { aspectos, texto }, userId) {
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

  if (texto !== undefined) {
    const comentario = await Comentario.findOne({ where: { revcab: id } });
    if (comentario) {
      await comentario.update({ texto, aprobado: false });
    } else {
      await Comentario.create({ revcab: id, texto, aprobado: false });
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

export async function deleteComentario(reviewId, userId) {
  const review = await ReviewCab.findByPk(reviewId);
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  if (review.alumno !== userId) {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No tenés permiso para eliminar este comentario');
  }

  const comentario = await Comentario.findOne({ where: { revcab: reviewId } });
  if (!comentario) throw new NotFoundError(ErrorCodes.COMMENT_NOT_FOUND.code, 'Comentario no encontrado');

  await VotoComentario.destroy({ where: { comentario: comentario.id } });
  await comentario.destroy();
}

export async function voteComentario(reviewId, valor, userId) {
  const review = await ReviewCab.findByPk(reviewId);
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  if (review.alumno === userId) {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'No podés votar tu propio comentario');
  }

  const comentario = await Comentario.findOne({ where: { revcab: reviewId } });
  if (!comentario) throw new NotFoundError(ErrorCodes.COMMENT_NOT_FOUND.code, 'Comentario no encontrado');

  const [voto, created] = await VotoComentario.findOrCreate({
    where: { comentario: comentario.id, alumno: userId },
    defaults: { valor },
  });

  if (!created) await voto.update({ valor });

  return ReviewCab.findByPk(reviewId, { include: withReviewAssociations() });
}

export async function deleteVoteComentario(reviewId, userId) {
  const review = await ReviewCab.findByPk(reviewId);
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  const comentario = await Comentario.findOne({ where: { revcab: reviewId } });
  if (!comentario) throw new NotFoundError(ErrorCodes.COMMENT_NOT_FOUND.code, 'Comentario no encontrado');

  const deleted = await VotoComentario.destroy({ where: { comentario: comentario.id, alumno: userId } });
  if (deleted === 0) throw new NotFoundError(ErrorCodes.VOTE_NOT_FOUND.code, 'Voto no encontrado');
}

export async function reportComentario(reviewId, { reason_type, reason_detail }, userId, userRole) {
  if (userRole === 'GUEST') {
    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS.code, 403, 'Los invitados no pueden reportar comentarios');
  }

  const review = await ReviewCab.findByPk(reviewId);
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  const comentario = await Comentario.findOne({ where: { revcab: reviewId } });
  if (!comentario) throw new NotFoundError(ErrorCodes.COMMENT_NOT_FOUND.code, 'Comentario no encontrado');

  if (comentario.is_banned) {
    throw new AppError(ErrorCodes.COMMENT_BANNED.code, 400, 'El comentario ya está baneado');
  }

  const existente = await ReporteComentario.findOne({
    where: { comentario_id: comentario.id, reporter_id: userId },
  });
  if (existente) {
    throw new ConflictError(ErrorCodes.REPORT_ALREADY_EXISTS.code, 'Ya reportaste este comentario');
  }

  await ReporteComentario.create({
    comentario_id: comentario.id,
    reporter_id: userId,
    reason_type,
    reason_detail: reason_detail || null,
  });

  return { message: 'Reporte enviado exitosamente' };
}

export async function getPendientesModeracion({ page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;

  return ReviewCab.findAndCountAll({
    include: [
      {
        association: 'contenidos',
        include: [{ association: 'Aspecto' }],
        order: [['id', 'ASC']],
      },
      {
        association: 'Curso',
        include: [{
          association: 'Seccion',
          attributes: ['id'],
          include: [
            { association: 'Docente' },
            { association: 'Materia' },
          ],
        }],
      },
      { association: 'Alumno', attributes: ['id', 'nombre', 'correo'] },
      { association: 'Comentario', required: true, where: { aprobado: false }, include: [{ association: 'votos' }] },
    ],
    order: [['fecha', 'DESC']],
    limit,
    offset,
    distinct: true,
  });
}

export async function aprobarComentario(reviewId) {
  const review = await ReviewCab.findByPk(reviewId);
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  const comentario = await Comentario.findOne({ where: { revcab: reviewId } });
  if (!comentario) throw new NotFoundError(ErrorCodes.COMMENT_NOT_FOUND.code, 'Comentario no encontrado');

  await comentario.update({ aprobado: true });

  return ReviewCab.findByPk(reviewId, { include: withReviewAssociations() });
}

export async function rechazarComentarioModeracion(reviewId) {
  const review = await ReviewCab.findByPk(reviewId);
  if (!review) throw new NotFoundError(ErrorCodes.REVIEW_NOT_FOUND.code, 'Review no encontrado');

  const comentario = await Comentario.findOne({ where: { revcab: reviewId } });
  if (!comentario) throw new NotFoundError(ErrorCodes.COMMENT_NOT_FOUND.code, 'Comentario no encontrado');

  await VotoComentario.destroy({ where: { comentario: comentario.id } });
  await comentario.destroy();

  return { message: 'Comentario rechazado y eliminado correctamente' };
}
