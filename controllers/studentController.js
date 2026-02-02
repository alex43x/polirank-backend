import StudentService from '../services/studentService.js';

class StudentController {
    constructor() {
        this.studentService = new StudentService();
    }

    /**
     * GET /students - Obtener todos los estudiantes
     */
    async getAllStudents(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                search: req.query.search || '',
                carrera_id: req.query.carrera_id,
                rol_id: req.query.rol_id,
            };

            const result = await this.studentService.getAllStudents(page, limit, filters);
            return res.json(result);
        } catch (error) {
            console.error('Error al obtener los usuarios:', error);
            res.status(500).json({ error: 'Error al obtener los usuarios' });
        }
    }

    /**
     * GET /students/:id - Obtener estudiante por ID
     */
    async getStudentById(req, res) {
        try {
            const { id } = req.params;
            const student = await this.studentService.getStudentById(id);
            return res.status(200).json(student);
        } catch (error) {
            console.error('Error al obtener el usuario:', error);
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error al obtener el usuario' });
        }
    }

    /**
     * GET /students/:id/reviews - Obtener reseñas de un estudiante
     */
    async getStudentReviews(req, res) {
        try {
            const { id } = req.params;
            const reviews = await this.studentService.getStudentReviews(id);
            return res.status(200).json(reviews);
        } catch (error) {
            console.error('Error al obtener las reseñas del usuario:', error);
            if (error.message.includes('No se encontraron')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error al obtener las reseñas del usuario' });
        }
    }

    /**
     * POST /students - Crear nuevo estudiante
     */
    async createStudent(req, res) {
        try {
            const newStudent = await this.studentService.createStudent(req.body);
            return res.status(201).json(newStudent);
        } catch (error) {
            console.error('Error al crear el usuario:', error);
            if (error.message.includes('Faltan campos')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error al crear el usuario' });
        }
    }

    /**
     * PUT /students/:id - Actualizar estudiante
     */
    async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const updatedStudent = await this.studentService.updateStudent(id, req.body);
            return res.status(200).json(updatedStudent);
        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error al actualizar el usuario' });
        }
    }

    /**
     * DELETE /students/:id - Eliminar estudiante
     */
    async deleteStudent(req, res) {
        try {
            const { id } = req.params;
            const result = await this.studentService.deleteStudent(id);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error al eliminar el usuario:', error);
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error al eliminar el usuario' });
        }
    }
}

export default new StudentController();
