import Curso from '../models/courseModel.js';
import Stats from '../models/statsModel.js';
import Aspecto from '../models/aspectModel.js';
import ReviewCab from '../models/reviewCab.js';

const getLastCourseBySection = (seccionId) => {
    return Curso.findOne({
        where: { seccion: seccionId },
        order: [
        ['year', 'DESC'],
        ['periodo', 'DESC']
        ]
    });
}

const getLastCoursesBySection = async (seccionId) => {
    const courses = await Curso.findAll({
        where: { seccion: seccionId },
        order: [
        ['year', 'DESC'],
        ['periodo', 'DESC'],
        ],
        limit: 2
    });

    return courses
};



const getCourseAverage = async (courseId) => {
    const stats = await getStatsByCourse(courseId);

    const sum = stats.rows.reduce((acc, stat) => acc + parseFloat(stat.promedio), 0);
    const result = stats.count > 0 ? (sum / stats.count).toFixed(2) : 0;
    return result === 'NaN' ? { result: 0 } : { result }; 
};

const totalReviewsForCourse = async (courseId) => {
    const count = await ReviewCab.count({
        where: { curso: courseId },
    });
    return count;
}

const getStatsByCourse = async (courseId) => {
    const stats = await Stats.findAndCountAll({
        where: { curso: courseId },
        include: [
            {
                model: Aspecto,
            },
        ],
        order: [["aspecto", "ASC"]],
    });
    return stats;
}

export { getLastCourseBySection, getCourseAverage, totalReviewsForCourse, getStatsByCourse, getLastCoursesBySection };
