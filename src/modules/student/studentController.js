import * as studentService from './studentService.js';
import { ApiResponse } from '../../shared/http/respond.js';
import { toStudentDto } from './studentDto.js';

export const getAllStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      search: req.query.search || '',
      carrera_id: req.query.carrera_id,
      rol_id: req.query.rol_id,
    };
    const result = await studentService.getAllStudents(page, limit, filters);
    return ApiResponse.success(res, result.rows.map(toStudentDto), {
      total: result.count,
      totalPages: Math.ceil(result.count / limit),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    return ApiResponse.success(res, toStudentDto(student));
  } catch (err) {
    next(err);
  }
};

export const getStudentReviews = async (req, res, next) => {
  try {
    const reviews = await studentService.getStudentReviews(req.params.id);
    return ApiResponse.success(res, reviews.rows, { total: reviews.count });
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const student = await studentService.createStudent(req.body);
    return res.status(201).json({ data: toStudentDto(student) });
  } catch (err) {
    next(err);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    return ApiResponse.success(res, toStudentDto(student));
  } catch (err) {
    next(err);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    await studentService.deleteStudent(req.params.id);
    return ApiResponse.success(res, { message: 'Alumno eliminado' });
  } catch (err) {
    next(err);
  }
};
