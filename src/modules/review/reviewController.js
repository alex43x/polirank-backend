import * as reviewService from './reviewService.js';
import { ApiResponse } from '../../shared/http/respond.js';
import { toStudentReviewDto, toAdminReviewDto } from './reviewDto.js';
import { hasPermission } from '../../shared/permissions/hasPermission.js';

const selectDto = (req) =>
  hasPermission(req, 'review:read:all') ? toAdminReviewDto : toStudentReviewDto;

export const getAllReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await reviewService.getAllReviews({
      page, limit, curso: req.query.curso, alumno: req.query.alumno,
    });
    return ApiResponse.success(res, result.rows.map(toAdminReviewDto), {
      total: result.count,
      totalPages: Math.ceil(result.count / limit),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const getReviewById = async (req, res, next) => {
  try {
    const isAdmin = hasPermission(req, 'review:read:all');
    const review = await reviewService.getReviewById(req.params.id, {
      userId: req.user.id,
      isAdmin,
    });
    return ApiResponse.success(res, selectDto(req)(review));
  } catch (err) {
    next(err);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.body, req.user.id);
    return res.status(201).json({ data: toStudentReviewDto(review) });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.params.id, req.body, req.user.id);
    return ApiResponse.success(res, toStudentReviewDto(review));
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user.id);
    return ApiResponse.success(res, { message: 'Review eliminado exitosamente' });
  } catch (err) {
    next(err);
  }
};

export const deleteComentario = async (req, res, next) => {
  try {
    await reviewService.deleteComentario(req.params.id, req.user.id);
    return ApiResponse.success(res, { message: 'Comentario eliminado exitosamente' });
  } catch (err) {
    next(err);
  }
};

export const voteComentario = async (req, res, next) => {
  try {
    const review = await reviewService.voteComentario(req.params.id, req.body.valor, req.user.id);
    return ApiResponse.success(res, selectDto(req)(review));
  } catch (err) {
    next(err);
  }
};

export const deleteVoteComentario = async (req, res, next) => {
  try {
    await reviewService.deleteVoteComentario(req.params.id, req.user.id);
    return ApiResponse.success(res, { message: 'Voto eliminado exitosamente' });
  } catch (err) {
    next(err);
  }
};
