import Alumno from '../models/studentModel.js';
import Matriculacion from '../models/enrollmentModel.js';
import Carrera from '../models/careerModel.js';
import ReviewCab from '../models/reviewCab.js';
import ReviewCont from '../models/reviewCont.js';
import Aspecto from '../models/aspectModel.js';
import { Op } from 'sequelize';

class StudentRepository {
    /**
     * Obtener estudiante por ID con relaciones
     */
    async findById(id) {
        return await Alumno.findByPk(id, {
            include: [
                { model: Alumno.associations?.Rol?.target },
                {
                    model: Matriculacion,
                    include: [{ model: Carrera }]
                }
            ]
        });
    }

    /**
     * Obtener todos los estudiantes con filtros y paginación
     */
    async findAll(filters = {}, pagination = {}) {
        const { search, carrera_id, rol_id } = filters;
        const { limit = 10, offset = 0 } = pagination;

        const whereConditions = {};

        if (search) {
            whereConditions[Op.or] = [
                { nombre: { [Op.iLike]: `%${search}%` } },
                { correo: { [Op.iLike]: `%${search}%` } },
            ];
        }

        if (rol_id) {
            whereConditions.rol = rol_id;
        }

        return await Alumno.findAndCountAll({
            where: whereConditions,
            include: [
                { association: 'Rol', attributes: ['id', 'nombre'] },
                {
                    model: Matriculacion,
                    attributes: ['id', 'carrera'],
                    include: [{ model: Carrera }]
                }
            ],
            order: [['id', 'ASC']],
            limit,
            offset,
        });
    }

    /**
     * Crear nuevo estudiante
     */
    async create(data) {
        return await Alumno.create(data);
    }

    /**
     * Actualizar estudiante
     */
    async update(id, data) {
        const student = await Alumno.findByPk(id);
        if (!student) return null;
        return await student.update(data);
    }

    /**
     * Eliminar estudiante
     */
    async delete(id) {
        return await Alumno.destroy({ where: { id } });
    }

    /**
     * Crear matriculación
     */
    async createEnrollment(alumno_id, carrera_id) {
        return await Matriculacion.create({
            alumno: alumno_id,
            carrera: carrera_id
        });
    }

    /**
     * Obtener matriculaciones por estudiante
     */
    async findEnrollmentsByStudent(alumno_id) {
        return await Matriculacion.findAll({
            where: { alumno: alumno_id },
            include: [{ model: Carrera }]
        });
    }

    async deleteEnrollmentsByStudent(alumno_id) {   
        return await Matriculacion.destroy({
            where: { alumno: alumno_id }
        });
    }

    async findReviewsByStudent(alumno_id) {
        return await ReviewCab.findAndCountAll({
            where: { alumno: alumno_id },
            include: [
                {
                    model: ReviewCont,
                    include: [
                        {
                            model: Aspecto,
                        },
                    ],
                    order: [['fecha', 'DESC'], [ReviewCont, Aspecto, 'id', 'ASC']],
                },
            ],
        });
    }

}

export default StudentRepository;

