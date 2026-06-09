import ReporteComentario from '../../models/reportModel.js';
import Comentario from '../../models/commentModel.js';
import ReviewCab from '../../models/reviewCab.js';
import Alumno from '../../models/studentModel.js';
import { NotFoundError, ConflictError } from '../../shared/errors/httpErrors.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import { COMMENT_STATUS } from '../../shared/constants/commentStatuses.js';

const reportIncludes = [
  {
    association: 'Comentario',
    include: [
      {
        association: 'ReviewCab',
        attributes: ['id', 'alumno'],
        include: [
          { association: 'Alumno', attributes: ['id', 'nombre', 'correo'] },
        ],
      },
    ],
  },
  { association: 'Reporter', attributes: ['id', 'nombre', 'correo'] },
];

export async function listReportesPendientes() {
  return ReporteComentario.findAll({
    where: { status: 'pending' },
    include: reportIncludes,
    order: [['created_at', 'DESC']],
  });
}

export async function aprobarReporte(reporteId, adminId) {
  const reporte = await ReporteComentario.findByPk(reporteId, { include: reportIncludes });
  if (!reporte) throw new NotFoundError(ErrorCodes.REPORT_NOT_FOUND.code, 'Reporte no encontrado');

  if (reporte.status !== 'pending') {
    throw new ConflictError(ErrorCodes.REPORT_ALREADY_REVIEWED.code, 'Este reporte ya fue revisado');
  }

  const comentario = await Comentario.findByPk(reporte.comentario_id);
  if (!comentario) throw new NotFoundError(ErrorCodes.COMMENT_NOT_FOUND.code, 'Comentario no encontrado');

  await comentario.update({ status: COMMENT_STATUS.BANEADO, banned_at: new Date() });
  await reporte.update({
    status: 'approved',
    reviewed_by: adminId,
    reviewed_at: new Date(),
  });

  return ReporteComentario.findByPk(reporte.id, { include: reportIncludes });
}

export async function rechazarReporte(reporteId, adminId) {
  const reporte = await ReporteComentario.findByPk(reporteId, { include: reportIncludes });
  if (!reporte) throw new NotFoundError(ErrorCodes.REPORT_NOT_FOUND.code, 'Reporte no encontrado');

  if (reporte.status !== 'pending') {
    throw new ConflictError(ErrorCodes.REPORT_ALREADY_REVIEWED.code, 'Este reporte ya fue revisado');
  }

  await reporte.update({
    status: 'rejected',
    reviewed_by: adminId,
    reviewed_at: new Date(),
  });

  return ReporteComentario.findByPk(reporte.id, { include: reportIncludes });
}

export async function banearComentario(comentarioId, adminId) {
  const comentario = await Comentario.findByPk(comentarioId);
  if (!comentario) throw new NotFoundError(ErrorCodes.COMMENT_NOT_FOUND.code, 'Comentario no encontrado');

  await comentario.update({ status: COMMENT_STATUS.BANEADO, banned_at: new Date() });

  return Comentario.findByPk(comentarioId);
}
