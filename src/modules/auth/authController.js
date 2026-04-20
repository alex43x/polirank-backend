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

export const createPassword = async (req, res, next) => {
  try {
    const { correo, newPassword } = req.body;
    const student = await authService.createPassword(correo, newPassword);
    return ApiResponse.success(res, { student: toUserDto(student) });
  } catch (err) {
    next(err);
  }
};
