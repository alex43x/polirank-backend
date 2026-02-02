import StudentRepository from '../repositories/studentRepository.js';

class StudentService {
    constructor() {
        this.studentRepository = new StudentRepository();
    }

    /**
     * Obtener todos los estudiantes con filtros y paginación
     */
    async getAllStudents(page = 1, limit = 10, filters = {}) {
        const offset = (page - 1) * limit;
        
        const students = await this.studentRepository.findAll(filters, { limit, offset });
        
        return {
            total: students.count,
            totalPages: Math.ceil(students.count / limit),
            currentPage: page,
            limit,
            students: students.rows,
        };
    }

    /**
     * Obtener estudiante por ID
     */
    async getStudentById(id) {
        const student = await this.studentRepository.findById(id);
        if (!student) {
            throw new Error('Usuario no encontrado');
        }
        return student;
    }

    /**
     * Obtener reseñas de un estudiante
     */
    async getStudentReviews(id) {
        // Verificar que el estudiante existe
        await this.getStudentById(id);

        const reviews = await this.studentRepository.findReviewsByStudent(id);

        if (reviews.count === 0) {
            throw new Error('No se encontraron reseñas para este usuario');
        }

        return reviews;
    }

    /**
     * Crear nuevo estudiante
     */
    async createStudent(data) {
        const { nombre, correo, password, rol, carreras } = data;

        if (!nombre || !correo || !password || !rol) {
            throw new Error('Faltan campos requeridos: nombre, correo, password, rol');
        }

        // Crear estudiante
        const newStudent = await this.studentRepository.create({
            nombre,
            correo,
            password,
            rol,
        });

        // Crear matriculaciones
        if (carreras && Array.isArray(carreras) && carreras.length > 0) {
            await Promise.all(
                carreras.map(carrera_id => 
                    this.studentRepository.createEnrollment(newStudent.id, carrera_id)
                )
            );
        }

        // Retornar estudiante con relaciones
        return await this.studentRepository.findById(newStudent.id);
    }

    /**
     * Actualizar estudiante
     */
    async updateStudent(id, data) {
        const { nombre, correo, rol, carreras } = data;

        const student = await this.studentRepository.findById(id);
        if (!student) {
            throw new Error('Usuario no encontrado');
        }

        await this.studentRepository.update(id, { nombre, correo, rol });

        // Actualizar matriculaciones
        if (carreras && Array.isArray(carreras)) {
            // Eliminar matriculaciones existentes
            await this.studentRepository.deleteEnrollmentsByStudent(id);

            // Crear nuevas matriculaciones
            await Promise.all(
                carreras.map(carrera_id => 
                    this.studentRepository.createEnrollment(id, carrera_id)
                )
            );
        }

        return await this.studentRepository.findById(id);
    }

    /**
     * Eliminar estudiante
     */
    async deleteStudent(id) {
        const student = await this.studentRepository.findById(id);
        if (!student) {
            throw new Error('Usuario no encontrado');
        }

        await this.studentRepository.deleteEnrollmentsByStudent(id);

        await this.studentRepository.delete(id);
        return { message: 'Usuario eliminado' };
    }
}

export default StudentService;