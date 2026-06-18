/** @param {import('sequelize').QueryInterface} queryInterface */
export async function up(queryInterface) {
  // Función helper para agregar un constraint ignorando el error si ya existe
  const addConstraintSafe = async (tableName, options) => {
    try {
      await queryInterface.addConstraint(tableName, options);
      console.log(`✅ Constraint añadido a ${tableName}`);
    } catch (error) {
      if (error.message.includes('already exists') || error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
        console.log(`⚠️ Constraint en ${tableName} ya existía, saltando...`);
      } else {
        throw error;
      }
    }
  };

  await addConstraintSafe('alumnos', {
    fields: ['correo'],
    type: 'unique',
    name: 'alumnos_correo_unique'
  });

  await addConstraintSafe('docentes', {
    fields: ['correo'],
    type: 'unique',
    name: 'docentes_correo_unique'
  });

  await addConstraintSafe('asignaturas', {
    fields: ['nombre', 'depto'],
    type: 'unique',
    name: 'asignaturas_nombre_depto_unique'
  });

  await addConstraintSafe('secciones', {
    fields: ['docente', 'asignatura'],
    type: 'unique',
    name: 'secciones_docente_asignatura_unique'
  });

  await addConstraintSafe('cursos', {
    fields: ['seccion', 'year', 'periodo'],
    type: 'unique',
    name: 'cursos_seccion_year_periodo_unique'
  });
}

/** @param {import('sequelize').QueryInterface} queryInterface */
export async function down(queryInterface) {
  const removeConstraintSafe = async (tableName, constraintName) => {
    try {
      await queryInterface.removeConstraint(tableName, constraintName);
    } catch (error) {
      console.log(`⚠️ No se pudo remover ${constraintName} de ${tableName}`);
    }
  };

  await removeConstraintSafe('cursos', 'cursos_seccion_year_periodo_unique');
  await removeConstraintSafe('secciones', 'secciones_docente_asignatura_unique');
  await removeConstraintSafe('asignaturas', 'asignaturas_nombre_depto_unique');
  await removeConstraintSafe('docentes', 'docentes_correo_unique');
  await removeConstraintSafe('alumnos', 'alumnos_correo_unique');
}
