import * as teacherService from './teacherService.js';
import { ApiResponse } from '../../shared/http/respond.js';
import { toTeacherDto, toSectionStatsDto } from './teacherDto.js';

export const getAllTeachers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await teacherService.getAllTeachers({
      page,
      limit,
      search: req.query.search,
    });
    return ApiResponse.success(res, result.rows.map(toTeacherDto), {
      total: result.count,
      totalPages: Math.ceil(result.count / limit),
      currentPage: page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await teacherService.getTeacherById(req.params.id);
    return ApiResponse.success(res, toTeacherDto(teacher));
  } catch (err) {
    next(err);
  }
};

export const getSectionsStatsByTeacherId = async (req, res, next) => {
  try {
    const { teacher, secciones } = await teacherService.getSectionsStatsByTeacherId(req.params.id);
    return ApiResponse.success(res, {
      ...toTeacherDto(teacher),
      secciones: secciones.map(toSectionStatsDto),
    });
  } catch (err) {
    next(err);
  }
};

export const getCoursesByTeacherId = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await teacherService.getCoursesByTeacherId(req.params.id, { page, limit });
    return ApiResponse.success(res, result.rows, {
      total: result.count,
      totalPages: Math.ceil(result.count / limit),
      currentPage: page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};
