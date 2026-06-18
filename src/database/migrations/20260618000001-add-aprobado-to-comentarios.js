import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  // Use try-catch in case the column was already added manually or sync({ alter: true }) was run
  try {
    await queryInterface.addColumn('comentarios', 'aprobado', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    console.log('✅ Columna "aprobado" agregada a la tabla "comentarios"');
  } catch (error) {
    if (error.message.includes('already exists') || (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists'))) {
      console.log('⚠️ La columna "aprobado" ya existe, saltando...');
    } else {
      throw error;
    }
  }
}

export async function down(queryInterface) {
  try {
    await queryInterface.removeColumn('comentarios', 'aprobado');
  } catch (error) {
    console.log('⚠️ No se pudo remover la columna "aprobado"');
  }
}
