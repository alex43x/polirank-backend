import sequelize from "../config/db.js";
import Alumno from "./studentModel.js";
import Rol from "./roleModel.js";
import Carrera from "./careerModel.js";
import Materia from "./subjectModel.js";
import Aspecto from "./aspectModel.js";
import Intento from "./triesModel.js";
import Docente from "./teacherModel.js";
import Seccion from "./sectionModel.js";
import Curso from "./courseModel.js";
import Malla from "./curriculumModel.js";
import ReviewCab from "./reviewCab.js";
import ReviewCont from "./reviewCont.js";
import Departamento from "./departmentModel.js";
import Estadistica from "./statsModel.js";
import Matriculacion from "./enrollmentModel.js";

// Alumno - Rol
Alumno.belongsTo(Rol, { foreignKey: 'rol', as: 'Rol' });
Rol.hasMany(Alumno, { foreignKey: 'rol', as: 'alumnos' });

// Matriculacion - Alumno
Matriculacion.belongsTo(Alumno, { foreignKey: 'alumno', as: 'Alumno' });
Alumno.hasMany(Matriculacion, { foreignKey: 'alumno', as: 'matriculaciones' });

// Matriculacion - Carrera
Matriculacion.belongsTo(Carrera, { foreignKey: 'carrera', as: 'Carrera' });
Carrera.hasMany(Matriculacion, { foreignKey: 'carrera', as: 'matriculaciones' });

// Intento - Alumno
Intento.belongsTo(Alumno, { foreignKey: 'alumno', as: 'Alumno' });
Alumno.hasMany(Intento, { foreignKey: 'alumno', as: 'intentos' });

// Intento - Materia
Intento.belongsTo(Materia, { foreignKey: 'asignatura', as: 'Materia' });
Materia.hasMany(Intento, { foreignKey: 'asignatura', as: 'intentos' });

// Seccion - Docente
Seccion.belongsTo(Docente, { foreignKey: 'docente', as: 'Docente' });
Docente.hasMany(Seccion, { foreignKey: 'docente', as: 'secciones' });

// Seccion - Materia
Seccion.belongsTo(Materia, { foreignKey: 'asignatura', as: 'Materia' });
Materia.hasMany(Seccion, { foreignKey: 'asignatura', as: 'secciones' });

// Curso - Seccion
Curso.belongsTo(Seccion, { foreignKey: 'seccion', as: 'Seccion' });
Seccion.hasMany(Curso, { foreignKey: 'seccion', as: 'cursos' });

// Malla - Carrera
Malla.belongsTo(Carrera, { foreignKey: 'carrera', as: 'Carrera' });
Carrera.hasMany(Malla, { foreignKey: 'carrera', as: 'mallas' });

// Malla - Materia
Malla.belongsTo(Materia, { foreignKey: 'asignatura', as: 'Materia' });
Materia.hasMany(Malla, { foreignKey: 'asignatura', as: 'mallas' });

// ReviewCab - Curso
ReviewCab.belongsTo(Curso, { foreignKey: 'curso', as: 'Curso' });
Curso.hasMany(ReviewCab, { foreignKey: 'curso', as: 'reviews' });

// ReviewCab - Alumno
ReviewCab.belongsTo(Alumno, { foreignKey: 'alumno', as: 'Alumno' });
Alumno.hasMany(ReviewCab, { foreignKey: 'alumno', as: 'reviews' });

// ReviewCont - ReviewCab
ReviewCont.belongsTo(ReviewCab, { foreignKey: 'revcab', as: 'ReviewCab' });
ReviewCab.hasMany(ReviewCont, { foreignKey: 'revcab', as: 'contenidos' });

// ReviewCont - Aspecto
ReviewCont.belongsTo(Aspecto, { foreignKey: 'aspecto', as: 'Aspecto' });
Aspecto.hasMany(ReviewCont, { foreignKey: 'aspecto', as: 'contenidos' });

// Materia - Departamento
Materia.belongsTo(Departamento, { foreignKey: 'depto', as: 'Departamento' });
Departamento.hasMany(Materia, { foreignKey: 'depto', as: 'materias' });

// Estadistica - Curso
Estadistica.belongsTo(Curso, { foreignKey: 'curso', as: 'Curso' });
Curso.hasMany(Estadistica, { foreignKey: 'curso', as: 'estadisticas' });

// Estadistica - Aspecto
Estadistica.belongsTo(Aspecto, { foreignKey: 'aspecto', as: 'Aspecto' });
Aspecto.hasMany(Estadistica, { foreignKey: 'aspecto', as: 'estadisticas' });

export { Alumno, Rol, Carrera, Aspecto, Intento, Docente, Seccion, Curso, Malla, Estadistica, Matriculacion, sequelize };
