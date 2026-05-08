import * as triesService from './triesService.js';
import { ApiResponse } from '../../shared/http/respond.js';
import { toTryDto } from './triesDto.js';

export const getAllTries = async (req, res, next) => {
  try {
    const result = await triesService.getAllTries();
    return ApiResponse.success(res, result.rows.map(toTryDto), { total: result.count });
  } catch (err) {
    next(err);
  }
};

export const getTryById = async (req, res, next) => {
  try {
    const tryInstance = await triesService.getTryById(req.params.id, req.user.id);
    return ApiResponse.success(res, toTryDto(tryInstance));
  } catch (err) {
    next(err);
  }
};

export const createTry = async (req, res, next) => {
  try {
    const newTry = await triesService.createTry(req.body, req.user.id);
    return res.status(201).json({ data: toTryDto(newTry) });
  } catch (err) {
    next(err);
  }
};

export const updateTry = async (req, res, next) => {
  try {
    const tryInstance = await triesService.updateTry(req.params.id, req.body, req.user.id);
    return ApiResponse.success(res, toTryDto(tryInstance));
  } catch (err) {
    next(err);
  }
};

export const deleteTry = async (req, res, next) => {
  try {
    await triesService.deleteTry(req.params.id, req.user.id);
    return ApiResponse.success(res, { message: 'Intento eliminado exitosamente' });
  } catch (err) {
    next(err);
  }
};
