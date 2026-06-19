import { DataTypes } from 'sequelize';

/** @param {import('sequelize').QueryInterface} queryInterface */
export async function up(queryInterface) {
  await queryInterface.createTable('roles', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
  });

  await queryInterface.createTable('departamentos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    siglas: { type: DataTypes.STRING, allowNull: false },
  });

  await queryInterface.createTable('carreras', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    semestres: { type: DataTypes.INTEGER, allowNull: false },
  });

  await queryInterface.createTable('alumnos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    correo: { type: DataTypes.TEXT, allowNull: false },
    nombre: { type: DataTypes.TEXT, allowNull: false },
    password: { type: DataTypes.TEXT, allowNull: false },
    rol: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'roles', key: 'id' } },
  });

  await queryInterface.createTable('matriculaciones', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    alumno: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'alumnos', key: 'id' } },
    carrera: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'carreras', key: 'id' } },
  });

  await queryInterface.createTable('asignaturas', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.TEXT, allowNull: false },
    depto: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'departamentos', key: 'id' } },
  });

  await queryInterface.createTable('malla', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    carrera: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'carreras', key: 'id' } },
    asignatura: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignaturas', key: 'id' } },
    semestre: { type: DataTypes.INTEGER, allowNull: false },
  });

  await queryInterface.addConstraint('malla', {
    fields: ['carrera', 'asignatura', 'semestre'],
    type: 'unique',
    name: 'malla_carrera_asignatura_semestre_unique',
  });

  await queryInterface.createTable('intentos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    alumno: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'alumnos', key: 'id' } },
    asignatura: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignaturas', key: 'id' } },
    valor: { type: DataTypes.INTEGER, allowNull: false },
  });

  await queryInterface.createTable('docentes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.TEXT, allowNull: false },
    correo: { type: DataTypes.TEXT, allowNull: false },
  });

  await queryInterface.createTable('secciones', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    docente: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'docentes', key: 'id' } },
    asignatura: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignaturas', key: 'id' } },
  });

  await queryInterface.createTable('cursos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    seccion: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'secciones', key: 'id' } },
    year: { type: DataTypes.INTEGER, allowNull: false },
    periodo: { type: DataTypes.INTEGER, allowNull: false },
  });

  await queryInterface.createTable('aspectos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
  });

  await queryInterface.createTable('reviewcab', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    curso: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'cursos', key: 'id' } },
    alumno: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'alumnos', key: 'id' } },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  await queryInterface.createTable('reviewcont', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    revcab: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'reviewcab', key: 'id' } },
    aspecto: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'aspectos', key: 'id' } },
    valor: { type: DataTypes.INTEGER, allowNull: false },
  });

  await queryInterface.createTable('estadisticas', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    curso: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'cursos', key: 'id' } },
    aspecto: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'aspectos', key: 'id' } },
    promedio: { type: DataTypes.FLOAT, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addConstraint('estadisticas', {
    fields: ['curso', 'aspecto'],
    type: 'unique',
    name: 'estadisticas_curso_aspecto_unique',
  });
}

/** @param {import('sequelize').QueryInterface} queryInterface */
export async function down(queryInterface) {
  await queryInterface.dropTable('estadisticas');
  await queryInterface.dropTable('reviewcont');
  await queryInterface.dropTable('reviewcab');
  await queryInterface.dropTable('aspectos');
  await queryInterface.dropTable('cursos');
  await queryInterface.dropTable('secciones');
  await queryInterface.dropTable('docentes');
  await queryInterface.dropTable('intentos');
  await queryInterface.dropTable('malla');
  await queryInterface.dropTable('asignaturas');
  await queryInterface.dropTable('matriculaciones');
  await queryInterface.dropTable('alumnos');
  await queryInterface.dropTable('carreras');
  await queryInterface.dropTable('departamentos');
  await queryInterface.dropTable('roles');
}
