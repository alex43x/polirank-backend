import * as sectionService from './sectionService.js';
import { ApiResponse } from '../../shared/http/respond.js';

export const getSectionLastStats = async (req, res, next) => {
  try {
    const result = await sectionService.getSectionLastStats(req.params.id);
    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getSectionHistoryStats = async (req, res, next) => {
  try {
    const result = await sectionService.getSectionHistoryStats(req.params.id);
    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getCoursesBySection = async (req, res, next) => {
  try {
    const result = await sectionService.getCoursesBySection(req.params.id);
    return ApiResponse.success(res, { cursos: result.rows, count: result.count });
  } catch (err) {
    next(err);
  }
};
