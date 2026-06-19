import * as reportsService from './reportsService.js';
import { ApiResponse } from '../../shared/http/respond.js';

export const listReportesPendientes = async (req, res, next) => {
  try {
    const reportes = await reportsService.listReportesPendientes();
    return ApiResponse.success(res, reportes);
  } catch (err) {
    next(err);
  }
};

export const aprobarReporte = async (req, res, next) => {
  try {
    const reporte = await reportsService.aprobarReporte(req.params.reporteId, req.user.id);
    return ApiResponse.success(res, reporte);
  } catch (err) {
    next(err);
  }
};

export const rechazarReporte = async (req, res, next) => {
  try {
    const reporte = await reportsService.rechazarReporte(req.params.reporteId, req.user.id);
    return ApiResponse.success(res, reporte);
  } catch (err) {
    next(err);
  }
};

export const banearComentario = async (req, res, next) => {
  try {
    const comentario = await reportsService.banearComentario(req.params.comentarioId, req.user.id);
    return ApiResponse.success(res, comentario);
  } catch (err) {
    next(err);
  }
};
