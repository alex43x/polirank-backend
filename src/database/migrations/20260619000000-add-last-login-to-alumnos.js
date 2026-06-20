import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.addColumn('alumnos', 'last_login', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('alumnos', 'last_login');
}
