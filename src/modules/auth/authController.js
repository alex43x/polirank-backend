import * as authService from './authService.js';
import { ApiResponse } from '../../shared/http/respond.js';
import { toUserDto } from './authDto.js';
import { toStudentReviewDto } from '../review/reviewDto.js';
import { toTryDto } from '../tries/triesDto.js';

export const login = async (req, res, next) => {
  try {
    const { correo, password } = req.body;
    const { token, student } = await authService.login(correo, password);
    return ApiResponse.success(res, { token, student: toUserDto(student) });
  } catch (err) {
    next(err);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const { student, reviews, tries } = await authService.getProfile(req.user.id);
    return ApiResponse.success(res, {
      student: toUserDto(student),
      reviews: { count: reviews.count, rows: reviews.rows.map(toStudentReviewDto) },
      tries: { count: tries.count, rows: tries.rows.map(toTryDto) },
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { correo } = req.body;
    const result = await authService.forgotPassword(correo);
    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    const result = await authService.verifyToken(token);
    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const { token: authToken, student } = await authService.resetPassword(token, newPassword);
    return ApiResponse.success(res, { token: authToken, student: toUserDto(student) });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const { token, nombre, password, carreras } = req.body;
    const { token: authToken, student } = await authService.register(token, { nombre, password, carreras });
    return res.status(201).json({ token: authToken, student: toUserDto(student) });
  } catch (err) {
    next(err);
  }
};
