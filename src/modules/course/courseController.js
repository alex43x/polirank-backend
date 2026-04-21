import Curso from '../../models/courseModel.js';
import Seccion from '../../models/sectionModel.js';
import Materia from '../../models/subjectModel.js';
import Docente from '../../models/teacherModel.js';
import ReviewCab from '../../models/reviewCab.js';
import ReviewCont from '../../models/reviewCont.js';
import Alumno from '../../models/studentModel.js';
import Aspecto from '../../models/aspectModel.js';
import { ApiResponse } from '../../shared/http/respond.js';
import { NotFoundError } from '../../shared/errors/httpErrors.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import { toCourseDto } from './courseDto.js';

function withCourseAssociations() {
  return [
    {
      association: 'Seccion',
      attributes: ['id'],
      include: [{ association: 'Docente' }, { association: 'Materia' }],
    },
  ];
}

export const getAllCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await Curso.findAndCountAll({
      include: withCourseAssociations(),
      order: [['id', 'ASC']],
      limit,
      offset,
      distinct: true,
    });

    return ApiResponse.success(res, result.rows.map(toCourseDto), {
      total: result.count,
      totalPages: Math.ceil(result.count / limit),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Curso.findByPk(req.params.id, { include: withCourseAssociations() });
    console.log('Course found:', course ? course.toJSON() : 'No course found');
    if (!course) throw new NotFoundError(ErrorCodes.COURSE_NOT_FOUND.code, 'El curso no existe');
    return ApiResponse.success(res, toCourseDto(course));
  } catch (err) {
    next(err);
  }
};

export const getReviewsByCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const course = await Curso.findByPk(id);
    if (!course) throw new NotFoundError(ErrorCodes.COURSE_NOT_FOUND.code, 'El curso no existe');

    const reviews = await ReviewCab.findAndCountAll({
      where: { curso: id },
      include: [
        { association: 'contenidos', include: [{ model: Aspecto }] },
        { association: 'Alumno' },
      ],
      limit,
      offset,
    });

    return ApiResponse.success(res, reviews.rows, {
      total: reviews.count,
      totalPages: Math.ceil(reviews.count / limit),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};
