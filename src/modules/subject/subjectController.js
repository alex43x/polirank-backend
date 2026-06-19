import * as subjectService from './subjectService.js';
import { ApiResponse } from '../../shared/http/respond.js';
import { toSubjectDto } from './subjectDto.js';

export const getAllSubjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await subjectService.getAllSubjects(
      {
        page,
        limit,
        search: req.query.search,
        dpto_id: req.query.dpto_id,
        career_id: req.query.career_id || null,
        semester: req.query.semester || null,
      },
      req.user,
      req.carreraId,
    );
    return ApiResponse.success(res, result.rows.map(toSubjectDto), {
      total: result.count,
      totalPages: Math.ceil(result.count / limit),
      currentPage: page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id, req.user, req.carreraId);
    return ApiResponse.success(res, toSubjectDto(subject));
  } catch (err) {
    next(err);
  }
};

export const getSectionsStatsBySubjectId = async (req, res, next) => {
  try {
    const result = await subjectService.getSectionsStatsBySubjectId(req.params.id);
    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getSubjectTriesStats = async (req, res, next) => {
  try {
    const stats = await subjectService.getSubjectTriesStats(req.params.id);
    return ApiResponse.success(res, stats);
  } catch (err) {
    next(err);
  }
};
