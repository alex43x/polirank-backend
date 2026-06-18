import Carrera from '../../models/careerModel.js';
import { ApiResponse } from '../../shared/http/respond.js';

export const getAllCareers = async (req, res, next) => {
  try {
    const careers = await Carrera.findAll({
      order: [['id', 'ASC']],
    });
    return ApiResponse.success(res, careers);
  } catch (err) {
    next(err);
  }
};
