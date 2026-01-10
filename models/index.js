import sequelize from "../db/connection.js";
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

// Definir relaciones: Alumno - Rol
Alumno.belongsTo(Rol, { foreignKey: 'rol' });
Rol.hasMany(Alumno, { foreignKey: 'rol' });

// Definir relaciones: Alumno - Carrera
Alumno.belongsTo(Carrera, { foreignKey: 'carrera' });
Carrera.hasMany(Alumno, { foreignKey: 'carrera' });

// Definir relaciones: Intento - Alumno
Intento.belongsTo(Alumno, { foreignKey: 'alumno' });
Alumno.hasMany(Intento, { foreignKey: 'alumno' });

// Definir relaciones: Intento - Materia
Intento.belongsTo(Materia, { foreignKey: 'asignatura' });
Materia.hasMany(Intento, { foreignKey: 'asignatura' });

// Definir relaciones: Docente - Seccion
Docente.hasMany(Seccion, { foreignKey: 'docente' });
Seccion.belongsTo(Docente, { foreignKey: 'docente' });

// Definir relaciones: Materia - Seccion
Materia.hasMany(Seccion, { foreignKey: 'asignatura' });
Seccion.belongsTo(Materia, { foreignKey: 'asignatura' });

// Definir relaciones: Seccion - Curso
Seccion.hasMany(Curso, { foreignKey: 'seccion' });
Curso.belongsTo(Seccion, { foreignKey: 'seccion' });

// Definir relaciones: Malla - Carrera
Malla.belongsTo(Carrera, { foreignKey: 'carrera' });
Carrera.hasMany(Malla, { foreignKey: 'carrera' });

// Definir relaciones: Malla - Materia
Malla.belongsTo(Materia, { foreignKey: 'asignatura' });
Materia.hasMany(Malla, { foreignKey: 'asignatura' });


// Definir relaciones: ReviewCab - Curso
ReviewCab.belongsTo(Curso, { foreignKey: "curso"    });
Curso.hasMany(ReviewCab, { foreignKey: "curso" });

// Definir relaciones: ReviewCab - Alumno
    ReviewCab.belongsTo(Alumno, { foreignKey: "alumno" });
Alumno.hasMany(ReviewCab, { foreignKey: "alumno" });

// Definir relaciones: ReviewCont - ReviewCab
ReviewCont.belongsTo(ReviewCab, { foreignKey: "revcab" });
ReviewCab.hasMany(ReviewCont, { foreignKey: "revcab" });

// Definir relaciones: ReviewCont - Aspecto
ReviewCont.belongsTo(Aspecto, { foreignKey: "aspecto" });
Aspecto.hasMany(ReviewCont, { foreignKey: "aspecto" });

export { Alumno, Rol, Carrera, Aspecto, Intento, Docente, Seccion, Curso, Malla, sequelize };
